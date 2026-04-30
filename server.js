const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = Number(process.env.PORT || 3000);
const ROOT = __dirname;
const players = new Map();

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
};

function sendJson(res, data) {
  res.writeHead(200, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(JSON.stringify(data));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 100_000) req.destroy();
    });
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

function cleanPlayers() {
  const now = Date.now();
  for (const [id, player] of players) {
    if (now - player.updatedAt > 5000) players.delete(id);
  }
}

function normalizeName(name) {
  return String(name || "").trim().toLowerCase();
}

function serveFile(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname === "/" ? "/index.html" : decodeURIComponent(url.pathname);
  const filePath = path.normalize(path.join(ROOT, pathname));

  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }
    res.writeHead(200, {
      "Content-Type": mimeTypes[path.extname(filePath)] || "application/octet-stream",
      "Cache-Control": "no-store",
    });
    res.end(data);
  });
}

const server = http.createServer(async (req, res) => {
  cleanPlayers();
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === "GET" && url.pathname === "/api/players") {
    const requester = url.searchParams.get("id");
    const list = [...players.entries()]
      .filter(([id]) => id !== requester)
      .map(([id, player]) => ({ id, ...player }));
    sendJson(res, { players: list });
    return;
  }

  if (req.method === "DELETE" && url.pathname === "/api/player") {
    const id = url.searchParams.get("id");
    if (id) players.delete(id);
    sendJson(res, { ok: true });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/player") {
    try {
      const player = JSON.parse(await readBody(req));
      if (!player.id) throw new Error("missing id");
      const id = String(player.id);
      const name = String(player.name || "Jugador").slice(0, 16);
      const normalizedName = normalizeName(name);
      for (const [otherId, other] of players) {
        if (otherId !== id && normalizeName(other.name) === normalizedName) {
          res.writeHead(409);
          res.end("Name already online");
          return;
        }
      }
      players.set(id, {
        name,
        x: Number(player.x) || 0,
        y: Number(player.y) || 0,
        mapName: String(player.mapName || "river"),
        facing: String(player.facing || "down"),
        inBoat: Boolean(player.inBoat),
        meditating: Boolean(player.meditating),
        chatBubble:
          player.chatBubble && typeof player.chatBubble === "object"
            ? {
                text: String(player.chatBubble.text || "").slice(0, 80),
                age: Number(player.chatBubble.age) || 0,
                life: Number(player.chatBubble.life) || 4200,
              }
            : null,
        equippedWeapon: String(player.equippedWeapon || "fists"),
        updatedAt: Date.now(),
      });
      sendJson(res, { ok: true });
    } catch {
      res.writeHead(400);
      res.end("Bad request");
    }
    return;
  }

  serveFile(req, res);
});

server.listen(PORT, () => {
  console.log(`Mini AO local multiplayer: http://localhost:${PORT}`);
});
