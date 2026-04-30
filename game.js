const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const stageWrap = document.querySelector(".stage-wrap");
const fishCount = document.getElementById("fishCount");
const goldCount = document.getElementById("goldCount");
const woodCount = document.getElementById("woodCount");
const energyText = document.getElementById("energyText");
const energyFill = document.getElementById("energyFill");
const manaText = document.getElementById("manaText");
const manaFill = document.getElementById("manaFill");
const toast = document.getElementById("toast");
const statusLine = document.getElementById("status");
const chatInput = document.getElementById("chatInput");
const toggleBoat = document.getElementById("toggleBoat");
const backToCharacters = document.getElementById("backToCharacters");
const resetGame = document.getElementById("resetGame");
const shopModal = document.getElementById("shopModal");
const closeShop = document.getElementById("closeShop");
const buySword = document.getElementById("buySword");
const shopStatus = document.getElementById("shopStatus");
const characterMenu = document.getElementById("characterMenu");
const characterSlots = document.getElementById("characterSlots");
const enterWorld = document.getElementById("enterWorld");
const createCharacter = document.getElementById("createCharacter");
const creationPanel = document.getElementById("creationPanel");
const characterName = document.getElementById("characterName");
const confirmCreate = document.getElementById("confirmCreate");
const characterStatus = document.getElementById("characterStatus");

const multiplayerChannel = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel("mini-ao-local") : null;
const multiplayer = {
  serverEnabled: location.protocol.startsWith("http"),
  localEnabled: Boolean(multiplayerChannel),
  enabled: location.protocol.startsWith("http") || Boolean(multiplayerChannel),
  id:
    (typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `player-${Date.now()}-${Math.random().toString(16).slice(2)}`),
  channel: multiplayerChannel,
  others: new Map(),
  lastSendAt: 0,
  lastPollAt: 0,
};
if (multiplayer.channel) {
  multiplayer.channel.addEventListener("message", (event) => handleLocalMultiplayerMessage(event.data));
}

const TILE = 48;
const MAP_W = 16;
const MAP_H = 12;
const MAX_ENERGY = 100;
const MAX_MANA = 100;
const FISHING_ENERGY_DRAIN = 0.6;
const ENERGY_RECHARGE = 18;
const MIN_FISHING_ENERGY = 12;
const MEDITATION_MANA_RECHARGE = 16;
const PUNCH_COOLDOWN = 600;
const PUNCH_ENERGY_COST = 5;
const PUNCH_MIN_DAMAGE = 7;
const PUNCH_MAX_DAMAGE = 10;
const BASIC_SWORD_COST = 40;
const SWORD_MIN_DAMAGE = 50;
const SWORD_MAX_DAMAGE = 60;
const ATTACK_HIT_CHANCE = 0.85;
const CREATURE_RESPAWN_DELAY = 10000;
const TREE_MAX_HEALTH = 100;
const CHOP_INTERVAL = 5000;
const CHOP_DAMAGE = 3;
const WOOD_PER_CHOP = 3;

const TILES = {
  grass: 0,
  water: 1,
  sand: 2,
  dock: 3,
  tree: 4,
  rock: 5,
  portal: 6,
  stump: 7,
  dungeon: 8,
  stationFloor: 9,
  stationWall: 10,
  rail: 11,
  platform: 12,
  stationDoor: 13,
  bridge: 14,
  debris: 15,
};

const maps = {
  river: [
  [4, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 1, 1, 1, 1],
  [4, 0, 0, 0, 0, 0, 5, 0, 0, 0, 2, 2, 1, 1, 1, 1],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 1, 1, 1, 1, 1],
  [0, 0, 5, 0, 0, 0, 0, 0, 2, 2, 1, 1, 1, 1, 1, 1],
  [0, 0, 0, 0, 0, 0, 6, 2, 2, 1, 1, 1, 1, 1, 1, 1],
  [0, 0, 0, 0, 3, 3, 3, 3, 1, 1, 1, 1, 1, 1, 1, 1],
  [0, 0, 0, 0, 3, 0, 0, 2, 1, 1, 1, 1, 1, 1, 1, 1],
  [0, 0, 0, 0, 3, 0, 0, 2, 2, 1, 1, 1, 1, 1, 1, 1],
  [0, 0, 0, 0, 3, 0, 0, 0, 2, 2, 1, 1, 1, 1, 1, 1],
  [0, 5, 0, 0, 0, 0, 0, 0, 0, 2, 2, 1, 1, 1, 1, 1],
  [4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 1, 1, 1, 1],
  [4, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 1, 1, 1, 1],
  ],
  forest: [
    [4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
    [4, 0, 0, 0, 4, 0, 0, 5, 0, 0, 4, 0, 0, 0, 0, 4],
    [4, 0, 4, 0, 0, 0, 4, 0, 0, 4, 0, 0, 5, 4, 0, 4],
    [4, 0, 0, 0, 4, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 4],
    [4, 4, 0, 5, 0, 0, 4, 0, 0, 0, 4, 0, 4, 0, 0, 4],
    [4, 0, 0, 0, 0, 4, 0, 0, 6, 0, 0, 0, 0, 0, 4, 4],
    [4, 0, 4, 0, 0, 0, 0, 0, 0, 0, 4, 0, 5, 0, 0, 4],
    [4, 0, 0, 0, 4, 0, 5, 0, 0, 0, 0, 0, 4, 0, 0, 4],
    [4, 0, 4, 0, 0, 0, 0, 4, 0, 4, 0, 0, 0, 0, 4, 4],
    [4, 0, 0, 0, 5, 4, 0, 0, 0, 0, 0, 4, 0, 0, 0, 4],
    [4, 0, 4, 0, 0, 0, 0, 4, 0, 5, 0, 0, 0, 4, 0, 4],
    [4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
  ],
  island: [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 2, 2, 0, 0, 0, 2, 2, 1, 1, 1, 1, 1],
    [1, 1, 1, 2, 2, 0, 0, 5, 0, 0, 2, 2, 1, 1, 1, 1],
    [1, 1, 1, 2, 0, 0, 4, 8, 0, 0, 0, 2, 1, 1, 1, 1],
    [1, 1, 2, 2, 0, 0, 0, 0, 0, 4, 0, 2, 2, 1, 1, 1],
    [1, 1, 1, 2, 0, 5, 0, 0, 0, 0, 2, 2, 1, 1, 1, 1],
    [1, 1, 1, 2, 2, 0, 0, 4, 0, 2, 2, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 2, 2, 0, 0, 2, 2, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 2, 2, 2, 2, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  ],
  coghlanDungeon: [
    [10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10],
    [10, 9, 9, 9, 9, 10, 10, 13, 10, 10, 9, 9, 9, 9, 9, 10],
    [10, 9, 15, 9, 9, 9, 9, 9, 9, 9, 9, 15, 9, 9, 9, 10],
    [10, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 10],
    [10, 9, 9, 9, 9, 9, 14, 14, 14, 14, 9, 9, 9, 9, 9, 10],
    [10, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 10],
    [10, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 10],
    [10, 9, 9, 9, 15, 9, 9, 9, 9, 9, 15, 9, 9, 9, 9, 10],
    [10, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 10],
    [10, 9, 9, 9, 9, 9, 9, 14, 14, 9, 9, 9, 9, 9, 9, 10],
    [10, 9, 15, 9, 9, 10, 9, 9, 9, 9, 10, 9, 9, 15, 9, 10],
    [10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10],
  ],
};

const solidTiles = new Set([TILES.water, TILES.tree, TILES.rock, TILES.stationWall]);
const keys = new Set();
const characters = Array.from({ length: 10 }, (_, index) => (index === 0 ? { name: "Khan" } : null));
let selectedCharacterSlot = 0;
const creatures = [
  { id: "coghlan-rat-1", mapName: "coghlanDungeon", x: 2 * TILE + 12, y: 2 * TILE + 8, w: 24, h: 28, hp: 100, maxHp: 100, gold: 10, respawnAt: 0, spawnedAt: performance.now() },
  { id: "coghlan-rat-2", mapName: "coghlanDungeon", x: 12 * TILE + 10, y: 2 * TILE + 8, w: 24, h: 28, hp: 100, maxHp: 100, gold: 10, respawnAt: 0, spawnedAt: performance.now() },
  { id: "coghlan-rat-3", mapName: "coghlanDungeon", x: 3 * TILE + 12, y: 9 * TILE + 8, w: 24, h: 28, hp: 100, maxHp: 100, gold: 10, respawnAt: 0, spawnedAt: performance.now() },
  { id: "coghlan-rat-4", mapName: "coghlanDungeon", x: 12 * TILE + 10, y: 9 * TILE + 8, w: 24, h: 28, hp: 100, maxHp: 100, gold: 10, respawnAt: 0, spawnedAt: performance.now() },
];

const player = {
  x: 4 * TILE + 12,
  y: 6 * TILE + 8,
  w: 24,
  h: 34,
  speed: 138,
  facing: "down",
};

const boat = {
  dockX: 8 * TILE + 9,
  dockY: 5 * TILE + 7,
  x: 8 * TILE + 9,
  y: 5 * TILE + 7,
  w: 34,
  h: 34,
};

const fisherNpc = {
  x: 3 * TILE + 12,
  y: 7 * TILE + 6,
  w: 24,
  h: 34,
  name: "<Pescador>",
};

const lumberjackNpc = {
  x: 1 * TILE + 12,
  y: 7 * TILE + 6,
  w: 24,
  h: 34,
  name: "<Leñador>",
};

const vendorNpc = {
  x: 5 * TILE + 12,
  y: 7 * TILE + 6,
  w: 24,
  h: 34,
  name: "<Vendedor>",
};

const state = {
  inWorld: false,
  characterName: "Khan",
  fish: 0,
  gold: 0,
  wood: 0,
  energy: MAX_ENERGY,
  mana: 35,
  hasSword: false,
  equippedWeapon: "fists",
  shopOpen: false,
  mapName: "river",
  inBoat: false,
  autoFishing: false,
  fishing: false,
  fishingSpot: null,
  autoChopping: false,
  choppingTarget: null,
  choppingTickAt: 0,
  treeHealth: {},
  meditating: false,
  chatting: false,
  chatBubble: null,
  goldPopup: null,
  combatPopup: null,
  punchFx: null,
  lastPunchAt: -PUNCH_COOLDOWN,
  holdingAttack: false,
  mapTitle: null,
  line: null,
  bobbers: [],
  ripples: [],
  lastTime: performance.now(),
};
let enteringWorld = false;

const tileColors = {
  [TILES.grass]: ["#356f33", "#2f6430", "#3f7f3a"],
  [TILES.water]: ["#1f7191", "#1a6482", "#2a87a5"],
  [TILES.sand]: ["#a88b55", "#967847", "#b89c62"],
  [TILES.dock]: ["#775237", "#67462f", "#8d6543"],
  [TILES.portal]: ["#473071", "#583a88", "#68489b"],
  [TILES.stump]: ["#694628", "#7b5634", "#5b3b22"],
  [TILES.dungeon]: ["#706d67", "#5f5b56", "#89847b"],
  [TILES.stationFloor]: ["#3f3b35", "#47423b", "#302d29"],
  [TILES.stationWall]: ["#69665e", "#5a5650", "#7b766c"],
  [TILES.rail]: ["#2d2a26", "#3a352f", "#1e1d1b"],
  [TILES.platform]: ["#706656", "#5f574b", "#847866"],
  [TILES.stationDoor]: ["#26221f", "#3b342e", "#151312"],
  [TILES.bridge]: ["#343331", "#4b4a47", "#242423"],
  [TILES.debris]: ["#4b463d", "#5d5547", "#312e28"],
};

function seeded(x, y, salt = 0) {
  const n = Math.sin(x * 127.1 + y * 311.7 + salt * 74.7) * 43758.5453;
  return n - Math.floor(n);
}

function tileInBounds(x, y) {
  return x >= 0 && y >= 0 && x < MAP_W && y < MAP_H;
}

function mapAt(tx, ty) {
  if (!tileInBounds(tx, ty)) return TILES.water;
  return maps[state.mapName][ty][tx];
}

function tileAt(px, py) {
  const x = Math.floor(px / TILE);
  const y = Math.floor(py / TILE);
  if (x < 0 || y < 0 || x >= MAP_W || y >= MAP_H) return TILES.water;
  return maps[state.mapName][y][x];
}

function setTileAt(tx, ty, tile) {
  if (!tileInBounds(tx, ty)) return;
  maps[state.mapName][ty][tx] = tile;
}

function treeKey(tx, ty) {
  return `${state.mapName}:${tx},${ty}`;
}

function getTreeHealth(tx, ty) {
  const key = treeKey(tx, ty);
  if (!Object.hasOwn(state.treeHealth, key)) state.treeHealth[key] = TREE_MAX_HEALTH;
  return state.treeHealth[key];
}

function canMoveTo(x, y) {
  const points = [
    [x + 4, y + player.h - 6],
    [x + player.w - 4, y + player.h - 6],
    [x + player.w / 2, y + player.h - 2],
  ];
  const hitsNpc = points.some(([px, py]) => {
    if (state.mapName !== "river") return false;
    return [fisherNpc, lumberjackNpc, vendorNpc].some((npc) => {
      return px >= npc.x - 4 && px <= npc.x + npc.w + 4 && py >= npc.y && py <= npc.y + npc.h + 4;
    });
  });
  if (hitsNpc) return false;

  const playerRect = { x, y, w: player.w, h: player.h };
  const hitsCreature = creatures.some((creature) => {
    if (creature.mapName !== state.mapName || creature.hp <= 0) return false;
    return rectsOverlap(playerRect, { x: creature.x - 4, y: creature.y - 4, w: creature.w + 8, h: creature.h + 8 });
  });
  if (hitsCreature) return false;

  return points.every(([px, py]) => {
    if (px < 0 || py < 0 || px >= canvas.width || py >= canvas.height) return false;
    const tile = tileAt(px, py);
    if (["river", "island"].includes(state.mapName) && tile === TILES.water) return true;
    return !solidTiles.has(tile);
  });
}

function setMessage(text) {
  toast.textContent = text;
  statusLine.textContent = text;
}

function updateStats() {
  fishCount.textContent = `Peces: ${state.fish}`;
  goldCount.textContent = `Oro: ${state.gold}`;
  woodCount.textContent = `Madera: ${state.wood}`;
  const energy = Math.round(state.energy);
  energyText.textContent = `Energia: ${energy}`;
  energyFill.style.width = `${energy}%`;
  const mana = Math.round(state.mana);
  manaText.textContent = `Mana: ${mana}`;
  manaFill.style.width = `${mana}%`;
}

function characterPreviewMarkup() {
  return `<div class="mini-character"><span class="mini-head"></span><span class="mini-body"></span><span class="mini-legs"></span></div>`;
}

function renderCharacterSlots() {
  characterSlots.innerHTML = "";
  characters.forEach((character, index) => {
    const slot = document.createElement("button");
    slot.type = "button";
    slot.className = `character-slot${index === selectedCharacterSlot ? " is-selected" : ""}`;
    slot.dataset.slot = String(index);
    slot.innerHTML = character
      ? `${characterPreviewMarkup()}<span class="character-name">${character.name}</span>`
      : `<span>Vacio</span>`;
    slot.addEventListener("click", () => {
      selectedCharacterSlot = index;
      creationPanel.classList.remove("is-open");
      characterStatus.textContent = character ? `${character.name} esta listo para entrar.` : "Slot vacio. Crea un personaje.";
      renderCharacterSlots();
    });
    slot.addEventListener("dblclick", () => {
      if (!character) return;
      selectedCharacterSlot = index;
      enterSelectedCharacter();
    });
    characterSlots.appendChild(slot);
  });
}

function createSelectedCharacter() {
  const name = characterName.value.trim().replace(/\s+/g, " ").slice(0, 16);
  if (!name) {
    characterStatus.textContent = "Elegí un nombre para el personaje.";
    return;
  }

  const emptySlot = characters.findIndex((character) => character === null);
  if (emptySlot === -1) {
    characterStatus.textContent = "No quedan slots libres.";
    return;
  }

  selectedCharacterSlot = emptySlot;
  characters[emptySlot] = { name };
  characterName.value = "";
  creationPanel.classList.remove("is-open");
  characterStatus.textContent = `${name} fue creado.`;
  renderCharacterSlots();
}

function normalizeCharacterName(name) {
  return String(name || "").trim().toLowerCase();
}

function localNameCheck(name) {
  return new Promise((resolve) => {
    if (!multiplayer.localEnabled) {
      resolve(false);
      return;
    }
    const requestId = `name-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const normalizedName = normalizeCharacterName(name);
    let settled = false;
    const finish = (taken) => {
      if (settled) return;
      settled = true;
      multiplayer.channel.removeEventListener("message", onMessage);
      resolve(taken);
    };
    const onMessage = (event) => {
      const message = event.data;
      if (message?.type === "name-taken" && message.requestId === requestId) finish(true);
    };
    multiplayer.channel.addEventListener("message", onMessage);
    multiplayer.channel.postMessage({ type: "name-check", requestId, id: multiplayer.id, name: normalizedName });
    setTimeout(() => finish(false), 220);
  });
}

async function serverNameCheck(name) {
  if (!multiplayer.serverEnabled) return false;
  try {
    const res = await fetch(`/api/players?id=${encodeURIComponent(multiplayer.id)}`, { cache: "no-store" });
    const data = await res.json();
    const normalizedName = normalizeCharacterName(name);
    return (data.players || []).some((other) => normalizeCharacterName(other.name) === normalizedName);
  } catch {
    return false;
  }
}

async function isCharacterNameOnline(name) {
  const [localTaken, serverTaken] = await Promise.all([localNameCheck(name), serverNameCheck(name)]);
  return localTaken || serverTaken;
}

async function enterSelectedCharacter() {
  if (enteringWorld) return;
  const character = characters[selectedCharacterSlot];
  if (!character) {
    characterStatus.textContent = "Selecciona un personaje creado.";
    return;
  }
  enteringWorld = true;
  enterWorld.disabled = true;
  characterStatus.textContent = `Buscando si ${character.name} ya esta online...`;
  const nameTaken = await isCharacterNameOnline(character.name);
  if (nameTaken) {
    characterStatus.textContent = `${character.name} ya esta online. Elegi o crea otro personaje.`;
    enterWorld.disabled = false;
    enteringWorld = false;
    return;
  }
  state.characterName = character.name;
  state.inWorld = true;
  characterMenu.classList.add("is-hidden");
  setMessage(`${character.name} entro al mundo.`);
  announceMultiplayerPresence();
  sendMultiplayerState(true);
  enterWorld.disabled = false;
  enteringWorld = false;
}

function showGoldPopup(amount) {
  state.goldPopup = {
    amount,
    createdAt: performance.now(),
    life: 2000,
  };
}

function currentMultiplayerState() {
  const now = performance.now();
  const chatBubble =
    state.chatBubble && now - state.chatBubble.createdAt <= state.chatBubble.life
      ? {
          text: state.chatBubble.text,
          age: now - state.chatBubble.createdAt,
          life: state.chatBubble.life,
        }
      : null;

  return {
    id: multiplayer.id,
    name: state.characterName,
    x: player.x,
    y: player.y,
    mapName: state.mapName,
    facing: player.facing,
    inBoat: state.inBoat,
    meditating: state.meditating,
    chatBubble,
    equippedWeapon: state.equippedWeapon,
    updatedAt: now,
  };
}

function announceMultiplayerPresence() {
  if (!multiplayer.localEnabled || !state.inWorld) return;
  multiplayer.channel.postMessage({ type: "hello", id: multiplayer.id });
}

function leaveMultiplayerPresence() {
  if (multiplayer.localEnabled) {
    multiplayer.channel.postMessage({ type: "leave", id: multiplayer.id });
  }
  if (multiplayer.serverEnabled) {
    fetch(`/api/player?id=${encodeURIComponent(multiplayer.id)}`, { method: "DELETE", keepalive: true }).catch(() => {});
  }
  multiplayer.others.clear();
}

function returnToCharacterMenu(message = "Selecciona un personaje.") {
  leaveMultiplayerPresence();
  state.inWorld = false;
  state.autoFishing = false;
  state.fishing = false;
  state.fishingSpot = null;
  state.autoChopping = false;
  state.choppingTarget = null;
  state.meditating = false;
  state.holdingAttack = false;
  state.chatting = false;
  state.shopOpen = false;
  state.line = null;
  keys.clear();
  closeChat();
  closeShopWindow();
  characterMenu.classList.remove("is-hidden");
  characterStatus.textContent = message;
  renderCharacterSlots();
  setMessage("Volviste a seleccion de personaje.");
}

function handleLocalMultiplayerMessage(message) {
  if (!message || message.id === multiplayer.id || (message.player && message.player.id === multiplayer.id)) return;
  if (message.type === "leave") {
    multiplayer.others.delete(message.id);
    return;
  }
  if (message.type === "hello") {
    sendMultiplayerState(true);
    return;
  }
  if (message.type === "name-check") {
    if (state.inWorld && normalizeCharacterName(state.characterName) === message.name) {
      multiplayer.channel.postMessage({ type: "name-taken", requestId: message.requestId, id: multiplayer.id });
    }
    return;
  }
  if (message.type === "state" && message.player) {
    multiplayer.others.set(message.player.id, {
      ...message.player,
      source: "local",
      updatedAt: performance.now(),
    });
  }
}

function cleanStaleMultiplayerPlayers() {
  const now = performance.now();
  for (const [id, other] of multiplayer.others) {
    if (now - (other.updatedAt || 0) > 5000) multiplayer.others.delete(id);
  }
}

function sendMultiplayerState(force = false) {
  if (!multiplayer.enabled || !state.inWorld) return;
  const now = performance.now();
  if (!force && now - multiplayer.lastSendAt < 90) return;
  multiplayer.lastSendAt = now;

  const playerState = currentMultiplayerState();
  if (multiplayer.localEnabled) {
    multiplayer.channel.postMessage({ type: "state", player: playerState });
  }

  if (!multiplayer.serverEnabled) return;
  fetch("/api/player", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(playerState),
    keepalive: true,
  })
    .then((res) => {
      if (res.status === 409) returnToCharacterMenu(`${state.characterName} ya esta online en otra sesion.`);
    })
    .catch(() => {});
}

function pollMultiplayerState(force = false) {
  if (!multiplayer.enabled || !state.inWorld) return;
  cleanStaleMultiplayerPlayers();
  if (!multiplayer.serverEnabled) return;
  const now = performance.now();
  if (!force && now - multiplayer.lastPollAt < 180) return;
  multiplayer.lastPollAt = now;

  fetch(`/api/players?id=${encodeURIComponent(multiplayer.id)}`)
    .then((res) => res.json())
    .then((data) => {
      const liveServerIds = new Set();
      for (const other of data.players || []) {
        liveServerIds.add(other.id);
        multiplayer.others.set(other.id, { ...other, source: "server", updatedAt: performance.now() });
      }
      for (const [id, other] of multiplayer.others) {
        if (other.source === "server" && !liveServerIds.has(id)) multiplayer.others.delete(id);
      }
    })
    .catch(() => {});
}

window.addEventListener("beforeunload", () => {
  leaveMultiplayerPresence();
});

function showCombatPopup(text, x, y) {
  state.combatPopup = {
    text,
    x,
    y,
    createdAt: performance.now(),
    life: 900,
  };
}

function showMapTitle(text) {
  state.mapTitle = {
    text,
    createdAt: performance.now(),
    life: 3000,
  };
}

function screenToWorld(event) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return {
    x: (event.clientX - rect.left) * scaleX,
    y: (event.clientY - rect.top) * scaleY,
  };
}

function distance(ax, ay, bx, by) {
  return Math.hypot(ax - bx, ay - by);
}

function pointInRect(px, py, rect) {
  return px >= rect.x && px <= rect.x + rect.w && py >= rect.y && py <= rect.y + rect.h;
}

function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function nearNpc() {
  if (state.mapName !== "river") return false;
  const p = playerCenter();
  return distance(p.x, p.y, fisherNpc.x + fisherNpc.w / 2, fisherNpc.y + fisherNpc.h / 2) < 78;
}

function nearLumberjack() {
  if (state.mapName !== "river") return false;
  const p = playerCenter();
  return distance(p.x, p.y, lumberjackNpc.x + lumberjackNpc.w / 2, lumberjackNpc.y + lumberjackNpc.h / 2) < 78;
}

function nearVendor() {
  if (state.mapName !== "river") return false;
  const p = playerCenter();
  return distance(p.x, p.y, vendorNpc.x + vendorNpc.w / 2, vendorNpc.y + vendorNpc.h / 2) < 78;
}

function sellFishToNpc() {
  if (!nearNpc()) {
    setMessage("Acercate al pescador para venderle.");
    return;
  }

  if (state.fish === 0) {
    setMessage("El pescador dice: No tenes peces para vender.");
    return;
  }

  const confirmed = window.confirm("¿Estás seguro que deseas venderle todos los peces?");
  if (!confirmed) {
    setMessage("Venta cancelada.");
    return;
  }

  const earned = state.fish * 7;
  state.gold += earned;
  state.fish = 0;
  showGoldPopup(earned);
  setMessage(`Le vendiste la pesca al pescador por ${earned} monedas.`);
  updateStats();
}

function sellWoodToNpc() {
  if (!nearLumberjack()) {
    setMessage("Acercate al leñador para venderle.");
    return;
  }

  if (state.wood === 0) {
    setMessage("El leñador dice: No tenes madera para vender.");
    return;
  }

  const confirmed = window.confirm("¿Estás seguro que deseas venderle toda la madera?");
  if (!confirmed) {
    setMessage("Venta cancelada.");
    return;
  }

  const earned = state.wood * 4;
  state.gold += earned;
  state.wood = 0;
  showGoldPopup(earned);
  setMessage(`Le vendiste la madera al leñador por ${earned} monedas.`);
  updateStats();
}

function updateShopStatus() {
  if (state.hasSword) {
    shopStatus.textContent = "Espada basica equipada. Daño 50-60.";
    buySword.textContent = "Equipada";
    buySword.disabled = true;
  } else {
    shopStatus.textContent = "Daño equipado: puños 7-10.";
    buySword.textContent = "Comprar";
    buySword.disabled = false;
  }
}

function openShop() {
  if (!nearVendor()) {
    setMessage("Acercate al vendedor.");
    return;
  }
  state.shopOpen = true;
  keys.clear();
  updateShopStatus();
  shopModal.classList.add("is-open");
  setMessage("Tienda abierta.");
}

function closeShopWindow() {
  state.shopOpen = false;
  shopModal.classList.remove("is-open");
}

function buyBasicSword() {
  if (state.hasSword) {
    updateShopStatus();
    return;
  }
  if (state.gold < BASIC_SWORD_COST) {
    setMessage("No tenes oro suficiente para comprar la espada.");
    shopStatus.textContent = "Te faltan monedas de oro.";
    return;
  }

  state.gold -= BASIC_SWORD_COST;
  state.hasSword = true;
  state.equippedWeapon = "basicSword";
  setMessage("Compraste y equipaste la espada basica.");
  updateStats();
  updateShopStatus();
}

function stopMeditating(message = null) {
  if (!state.meditating) return;
  state.meditating = false;
  if (message) setMessage(message);
}

function startMeditating() {
  if (state.autoFishing || state.fishing) stopAutoFishing("Dejaste de pescar para meditar.");
  state.meditating = true;
  state.chatBubble = {
    text: "/meditar",
    createdAt: performance.now(),
    life: 1800,
  };
  setMessage("Estas meditando. La mana se recarga hasta 100.");
}

function teleportTo(targetMap) {
  stopAutoFishing(null);
  if (state.autoChopping) stopAutoChopping(null);
  stopMeditating(null);
  state.inBoat = false;
  state.mapName = targetMap;
  state.line = null;
  state.fishingSpot = null;
  toggleBoat.textContent = "Barca automatica";

  if (targetMap === "forest") {
    player.x = 8 * TILE + 12;
    player.y = 6 * TILE + 8;
    setMessage("Entraste al bosque. Click derecho a un arbol cercano para talar.");
  } else {
    player.x = 6 * TILE + 12;
    player.y = 5 * TILE + 8;
    setMessage("Volviste al mapa de pesca.");
  }
}

function activatePortal() {
  teleportTo(state.mapName === "river" ? "forest" : "river");
}

function sailToMap(targetMap, x, y, message) {
  stopAutoFishing(null);
  stopMeditating(null);
  state.mapName = targetMap;
  player.x = x;
  player.y = y;
  state.inBoat = tileAt(player.x + player.w / 2, player.y + player.h - 2) === TILES.water;
  if (state.inBoat) {
    boat.x = player.x - 5;
    boat.y = player.y + 1;
  }
  setMessage(message);
  if (targetMap === "island") showMapTitle("ISLA COGHLAN");
}

function handleMapEdgeTransition(dx) {
  if (state.mapName === "river" && state.inBoat && dx > 0 && player.x + player.w >= canvas.width - 4) {
    sailToMap("island", 2, player.y, "Llegaste a Isla Coghlan.");
    return true;
  }

  if (state.mapName === "island" && state.inBoat && dx < 0 && player.x <= 4) {
    sailToMap("river", canvas.width - player.w - 3, player.y, "Volviste al rio.");
    return true;
  }

  return false;
}

function enterCoghlanDungeon() {
  stopAutoFishing(null);
  stopMeditating(null);
  state.inBoat = false;
  state.mapName = "coghlanDungeon";
  player.x = 7 * TILE + 12;
  player.y = 2 * TILE + 8;
  player.facing = "down";
  setMessage("Entraste al Dungeon Coghlan.");
  showMapTitle("DUNGEON COGHLAN");
}

function leaveCoghlanDungeon() {
  state.mapName = "island";
  player.x = 7 * TILE + 12;
  player.y = 6 * TILE + 8;
  state.inBoat = false;
  setMessage("Saliste del viejo anden.");
  showMapTitle("ISLA COGHLAN");
}

function attackPoint() {
  const p = playerCenter();
  const reach = 46;
  if (player.facing === "left") return { x: p.x - reach, y: p.y };
  if (player.facing === "right") return { x: p.x + reach, y: p.y };
  if (player.facing === "up") return { x: p.x, y: p.y - reach };
  return { x: p.x, y: p.y + reach };
}

function findAdjacentCreature() {
  const hit = attackPoint();
  return creatures.find((creature) => {
    if (creature.mapName !== state.mapName || creature.hp <= 0) return false;
    const cx = creature.x + creature.w / 2;
    const cy = creature.y + creature.h / 2;
    return distance(hit.x, hit.y, cx, cy) < 38;
  });
}

function punch() {
  const now = performance.now();
  if (now - state.lastPunchAt < PUNCH_COOLDOWN) {
    setMessage("Todavia estas recuperando el golpe.");
    return;
  }

  if (state.energy < PUNCH_ENERGY_COST) {
    setMessage("No tenes energia para golpear.");
    return;
  }

  if (state.autoFishing || state.fishing) stopAutoFishing("Dejaste de pescar.");
  if (state.autoChopping) stopAutoChopping("Dejaste de talar.");
  stopMeditating("Dejaste de meditar.");

  state.lastPunchAt = now;
  state.energy = Math.max(0, state.energy - PUNCH_ENERGY_COST);
  const hit = attackPoint();
  state.punchFx = { x: hit.x, y: hit.y, createdAt: now, life: 220 };

  const target = findAdjacentCreature();
  if (!target) {
    setMessage("Tiraste un golpe al aire.");
    showCombatPopup("miss", hit.x, hit.y);
    updateStats();
    return;
  }

  if (Math.random() > ATTACK_HIT_CHANCE) {
    setMessage("Fallaste el golpe.");
    showCombatPopup("miss", target.x + target.w / 2, target.y);
    updateStats();
    return;
  }

  const minDamage = state.equippedWeapon === "basicSword" ? SWORD_MIN_DAMAGE : PUNCH_MIN_DAMAGE;
  const maxDamage = state.equippedWeapon === "basicSword" ? SWORD_MAX_DAMAGE : PUNCH_MAX_DAMAGE;
  const damage = Math.floor(minDamage + Math.random() * (maxDamage - minDamage + 1));
  target.hp = Math.max(0, target.hp - damage);
  setMessage(`Golpeaste por ${damage}.`);
  showCombatPopup(`-${damage}`, target.x + target.w / 2, target.y);
  if (target.hp === 0) {
    state.gold += target.gold;
    target.respawnAt = now + CREATURE_RESPAWN_DELAY;
    showGoldPopup(target.gold);
    setMessage(`Derrotaste a la criatura y ganaste ${target.gold} monedas.`);
  }
  updateStats();
}

function isCreatureSpawnTile(tile) {
  return [TILES.stationFloor, TILES.platform, TILES.bridge].includes(tile);
}

function randomCreatureSpawn(creature) {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    const tx = 1 + Math.floor(Math.random() * (MAP_W - 2));
    const ty = 1 + Math.floor(Math.random() * (MAP_H - 2));
    if (!isCreatureSpawnTile(maps.coghlanDungeon[ty][tx])) continue;

    const x = tx * TILE + 12;
    const y = ty * TILE + 8;
    const rect = { x, y, w: creature.w, h: creature.h };
    const playerRect = { x: player.x, y: player.y, w: player.w, h: player.h };
    if (state.mapName === "coghlanDungeon" && rectsOverlap(rect, { x: playerRect.x - 48, y: playerRect.y - 48, w: playerRect.w + 96, h: playerRect.h + 96 })) continue;

    const overlapsCreature = creatures.some((other) => {
      if (other === creature || other.hp <= 0) return false;
      return rectsOverlap(rect, { x: other.x - 16, y: other.y - 16, w: other.w + 32, h: other.h + 32 });
    });
    if (overlapsCreature) continue;

    return { x, y };
  }

  return { x: 8 * TILE + 12, y: 7 * TILE + 8 };
}

function updateCreatureRespawns(now) {
  for (const creature of creatures) {
    if (creature.hp > 0 || !creature.respawnAt || now < creature.respawnAt) continue;
    const spawn = randomCreatureSpawn(creature);
    creature.x = spawn.x;
    creature.y = spawn.y;
    creature.hp = creature.maxHp;
    creature.respawnAt = 0;
    creature.spawnedAt = now;
  }
}

function stopAutoChopping(message = "Dejaste de talar.") {
  state.autoChopping = false;
  state.choppingTarget = null;
  state.choppingTickAt = 0;
  if (message) setMessage(message);
}

function startAutoChopping(tx, ty) {
  const p = playerCenter();
  const treeCenterX = tx * TILE + TILE / 2;
  const treeCenterY = ty * TILE + TILE / 2;
  if (distance(p.x, p.y, treeCenterX, treeCenterY) > 82) {
    setMessage("Estas muy lejos del arbol.");
    return;
  }

  stopMeditating("Dejaste de meditar.");
  if (state.autoFishing || state.fishing) stopAutoFishing("Dejaste de pescar.");
  state.autoChopping = true;
  state.choppingTarget = { tx, ty };
  state.choppingTickAt = performance.now() + CHOP_INTERVAL;
  setMessage(`Talando arbol. Vida: ${Math.ceil(getTreeHealth(tx, ty))}/100.`);
}

function applyChopTick(now) {
  if (!state.autoChopping || !state.choppingTarget) return;
  if (now < state.choppingTickAt) return;

  const { tx, ty } = state.choppingTarget;
  if (state.mapName !== "forest" || mapAt(tx, ty) !== TILES.tree) {
    stopAutoChopping("La tala se corto.");
    return;
  }

  const health = Math.max(0, getTreeHealth(tx, ty) - CHOP_DAMAGE);
  state.treeHealth[treeKey(tx, ty)] = health;
  state.wood += WOOD_PER_CHOP;
  state.ripples.push({ x: tx * TILE + TILE / 2, y: ty * TILE + TILE / 2, r: 6, life: 1, color: "wood" });
  updateStats();

  if (health <= 0) {
    setTileAt(tx, ty, TILES.stump);
    stopAutoChopping("El arbol cayo. Quedo un tocon.");
    return;
  }

  setMessage(`Talando... madera +${WOOD_PER_CHOP}. Vida del arbol: ${Math.ceil(health)}/100.`);
  state.choppingTickAt = now + CHOP_INTERVAL;
}

function chopTreeAt(x, y) {
  if (state.mapName !== "forest") return false;
  const tx = Math.floor(x / TILE);
  const ty = Math.floor(y / TILE);
  if (mapAt(tx, ty) !== TILES.tree) return false;
  startAutoChopping(tx, ty);
  return true;
}

function openChat() {
  closeShopWindow();
  state.chatting = true;
  keys.clear();
  chatInput.value = "";
  chatInput.classList.add("is-open");
  stageWrap.classList.add("is-chatting");
  chatInput.focus();
  setMessage("Escribi tu mensaje y apreta Enter.");
}

function closeChat() {
  state.chatting = false;
  chatInput.value = "";
  chatInput.classList.remove("is-open");
  stageWrap.classList.remove("is-chatting");
  canvas.focus();
}

function sendChat() {
  const text = chatInput.value.trim().replace(/\s+/g, " ");
  if (text) {
    if (text.toLowerCase() === "/meditar") {
      closeChat();
      startMeditating();
      return;
    }

    if (text.toLowerCase() === "/salir") {
      closeChat();
      returnToCharacterMenu(`${state.characterName} salio del mundo.`);
      return;
    }

    state.chatBubble = {
      text: text.slice(0, 80),
      createdAt: performance.now(),
      life: 4200,
    };
    setMessage(`Dijiste: ${text}`);
  }
  closeChat();
}

function playerCenter() {
  return {
    x: player.x + player.w / 2,
    y: player.y + player.h - 6,
  };
}

function boatCenter() {
  return {
    x: boat.x + boat.w / 2,
    y: boat.y + boat.h / 2,
  };
}

function nearBoat() {
  const p = playerCenter();
  const b = boatCenter();
  return distance(p.x, p.y, b.x, b.y) < 62;
}

function toggleBoatMode() {
  setMessage("La barca ahora es automatica: entra al agua para navegar.");
}

function canFishAt(x, y, showMessages = true) {
  if (tileAt(x, y) !== TILES.water) {
    if (showMessages) setMessage("Ahi no hay aguita. Click derecho sobre el agua.");
    return false;
  }

  const p = playerCenter();
  const range = state.inBoat ? 230 : 130;
  if (distance(p.x, p.y, x, y) > range) {
    if (showMessages) setMessage(state.inBoat ? "Ni desde la barca llegas tan lejos." : "Estas muy lejos de la orilla.");
    return false;
  }

  if (state.energy < MIN_FISHING_ENERGY) {
    if (showMessages) setMessage("No tenes energia para pescar. Descansa un toque.");
    return false;
  }

  return true;
}

function castFishingLine(x, y) {
  if (!canFishAt(x, y, false)) {
    stopAutoFishing("La pesca se corto.");
    return;
  }

  state.fishing = true;
  state.line = { x, y, started: performance.now(), biteAt: performance.now() + 900 + Math.random() * 1400 };
  state.bobbers.push({ x, y, life: 1 });
}

function startAutoFishing(x, y) {
  if (state.mapName !== "river") {
    setMessage("Aca no hay agua para pescar.");
    return;
  }

  if (!canFishAt(x, y)) return;

  state.autoFishing = true;
  state.fishingSpot = { x, y };
  castFishingLine(x, y);
  setMessage("Pescando automaticamente. Click derecho para cortar.");
}

function updateBoatState() {
  if (!["river", "island"].includes(state.mapName)) {
    state.inBoat = false;
    return;
  }

  const feetTile = tileAt(player.x + player.w / 2, player.y + player.h - 2);
  const shouldBeInBoat = feetTile === TILES.water;
  if (shouldBeInBoat !== state.inBoat) {
    state.inBoat = shouldBeInBoat;
    setMessage(shouldBeInBoat ? "Subiste automaticamente a la barca." : "Bajaste a tierra.");
  }

  if (state.inBoat) {
    boat.x = player.x - 5;
    boat.y = player.y + 1;
  }
}

function stopAutoFishing(message = "Dejaste de pescar.") {
  state.autoFishing = false;
  state.fishing = false;
  state.fishingSpot = null;
  state.line = null;
  if (message) setMessage(message);
}

function finishFishing() {
  const success = Math.random() > 0.28;
  state.fishing = false;
  if (!state.line) return;
  state.ripples.push({ x: state.line.x, y: state.line.y, r: 8, life: 1 });
  state.line = null;

  if (success) {
    state.fish += 1;
    setMessage("Sacaste un pejerrey. Bien ahi.");
  } else {
    setMessage("Se escapo. El rio se hizo el vivo.");
  }
  updateStats();

  if (state.autoFishing && state.energy >= MIN_FISHING_ENERGY && state.fishingSpot) {
    castFishingLine(state.fishingSpot.x, state.fishingSpot.y);
  } else if (state.autoFishing) {
    stopAutoFishing("Te quedaste sin energia. Descansa para recargar.");
  }
}

function update(dt, now) {
  if (!state.inWorld) {
    updateCreatureRespawns(now);
    return;
  }

  let dx = 0;
  let dy = 0;
  if (!state.chatting) {
    const left = keys.has("arrowleft") || keys.has("a");
    const right = keys.has("arrowright") || keys.has("d");
    const up = keys.has("arrowup") || keys.has("w");
    const down = keys.has("arrowdown") || keys.has("s");

    if (left && !right) dx = -1;
    else if (right && !left) dx = 1;

    if (dx === 0) {
      if (up && !down) dy = -1;
      else if (down && !up) dy = 1;
    }
  }

  const isMoving = Boolean(dx || dy);

  if (isMoving && state.autoFishing) {
    stopAutoFishing("Te moviste y cortaste la pesca.");
  }

  if (isMoving && state.autoChopping) {
    stopAutoChopping("Te moviste y cortaste la tala.");
  }

  if (isMoving && state.meditating) {
    stopMeditating("Dejaste de meditar.");
  }

  if (isMoving && state.shopOpen) {
    closeShopWindow();
  }

  if (isMoving) {
    if (Math.abs(dx) > Math.abs(dy)) player.facing = dx > 0 ? "right" : "left";
    else player.facing = dy > 0 ? "down" : "up";

    const nx = player.x + dx * player.speed * dt;
    const ny = player.y + dy * player.speed * dt;
    if (canMoveTo(nx, player.y)) player.x = nx;
    if (canMoveTo(player.x, ny)) player.y = ny;

    updateBoatState();
    if (!handleMapEdgeTransition(dx) && dx > 0 && state.inBoat && player.x + player.w >= canvas.width - 8) {
      handleMapEdgeTransition(dx);
    }
  }

  if (!isMoving) updateBoatState();

  if (tileAt(player.x + player.w / 2, player.y + player.h) === TILES.portal) {
    activatePortal();
  }

  if (state.mapName === "island" && tileAt(player.x + player.w / 2, player.y + player.h) === TILES.dungeon) {
    enterCoghlanDungeon();
  }

  if (state.mapName === "coghlanDungeon" && tileAt(player.x + player.w / 2, player.y + player.h) === TILES.stationDoor) {
    leaveCoghlanDungeon();
  }

  if (state.holdingAttack && !state.chatting) {
    punch();
  }

  updateCreatureRespawns(now);

  if (state.fishing && state.line && now >= state.line.biteAt) {
    finishFishing();
  }

  applyChopTick(now);

  if (state.autoFishing) {
    state.energy = Math.max(0, state.energy - FISHING_ENERGY_DRAIN * dt);
    if (state.energy <= 0) {
      stopAutoFishing("Te quedaste sin energia. Descansa para recargar.");
    }
    updateStats();
  } else if (!state.fishing && !isMoving && !state.chatting && state.energy < MAX_ENERGY) {
    state.energy = Math.min(MAX_ENERGY, state.energy + ENERGY_RECHARGE * dt);
    updateStats();
  }

  if (state.meditating && state.mana < MAX_MANA) {
    state.mana = Math.min(MAX_MANA, state.mana + MEDITATION_MANA_RECHARGE * dt);
    updateStats();
  }

  if (state.chatBubble && now - state.chatBubble.createdAt > state.chatBubble.life) {
    state.chatBubble = null;
  }

  if (state.goldPopup && now - state.goldPopup.createdAt > state.goldPopup.life) {
    state.goldPopup = null;
  }

  if (state.combatPopup && now - state.combatPopup.createdAt > state.combatPopup.life) {
    state.combatPopup = null;
  }

  if (state.punchFx && now - state.punchFx.createdAt > state.punchFx.life) {
    state.punchFx = null;
  }

  if (state.mapTitle && now - state.mapTitle.createdAt > state.mapTitle.life) {
    state.mapTitle = null;
  }

  sendMultiplayerState();
  pollMultiplayerState();

  state.bobbers = state.bobbers.filter((b) => {
    b.life -= dt * 0.55;
    return b.life > 0;
  });
  state.ripples = state.ripples.filter((r) => {
    r.r += dt * 34;
    r.life -= dt * 0.75;
    return r.life > 0;
  });
}

function drawPixelGrass(px, py, x, y) {
  for (let i = 0; i < 12; i += 1) {
    const rx = Math.floor(seeded(x, y, i) * 44) + 2;
    const ry = Math.floor(seeded(x, y, i + 20) * 44) + 2;
    ctx.fillStyle = seeded(x, y, i + 40) > 0.45 ? "#4c8e43" : "#24572d";
    ctx.fillRect(px + rx, py + ry, 2, 2);
  }
}

function drawPixelSand(px, py, x, y) {
  for (let i = 0; i < 11; i += 1) {
    const rx = Math.floor(seeded(x, y, i + 80) * 44) + 2;
    const ry = Math.floor(seeded(x, y, i + 100) * 44) + 2;
    ctx.fillStyle = seeded(x, y, i + 120) > 0.48 ? "#c6ad74" : "#7f663e";
    ctx.fillRect(px + rx, py + ry, 2, 2);
  }
}

function drawWaterDetail(px, py, x, y, now) {
  const shift = Math.floor(now / 260 + x * 3 + y * 5) % 18;
  ctx.strokeStyle = "rgba(184, 236, 242, 0.28)";
  ctx.lineWidth = 2;
  for (let i = 0; i < 2; i += 1) {
    const yy = py + 13 + i * 18 + ((shift + i * 5) % 7);
    ctx.beginPath();
    ctx.moveTo(px + 7, yy);
    ctx.lineTo(px + 16, yy - 3);
    ctx.lineTo(px + 27, yy);
    ctx.lineTo(px + 39, yy - 4);
    ctx.stroke();
  }
}

function drawCoastEdges(px, py, x, y, type) {
  if (![TILES.grass, TILES.sand, TILES.dock].includes(type)) return;

  const bank = type === TILES.dock ? "#4d3424" : "#80683f";
  const foam = "rgba(238, 216, 139, 0.26)";

  function blob(cx, cy, w, h, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(cx, cy, w, h, seeded(cx, cy, 2) * 0.8 - 0.4, 0, Math.PI * 2);
    ctx.fill();
  }

  if (mapAt(x + 1, y) === TILES.water) {
    for (let i = 0; i < 5; i += 1) {
      const cy = py + 6 + i * 9 + seeded(x, y, i) * 5;
      blob(px + TILE - 2 + seeded(x, y, i + 9) * 5, cy, 5, 8, bank);
      blob(px + TILE - 9, cy + 2, 2, 5, foam);
    }
  }
  if (mapAt(x - 1, y) === TILES.water) {
    for (let i = 0; i < 5; i += 1) {
      const cy = py + 6 + i * 9 + seeded(x, y, i + 20) * 5;
      blob(px + 2 - seeded(x, y, i + 29) * 5, cy, 5, 8, bank);
      blob(px + 8, cy + 2, 2, 5, foam);
    }
  }
  if (mapAt(x, y + 1) === TILES.water) {
    for (let i = 0; i < 5; i += 1) {
      const cx = px + 6 + i * 9 + seeded(x, y, i + 40) * 5;
      blob(cx, py + TILE - 2 + seeded(x, y, i + 49) * 5, 8, 5, bank);
      blob(cx + 2, py + TILE - 9, 5, 2, foam);
    }
  }
  if (mapAt(x, y - 1) === TILES.water) {
    for (let i = 0; i < 5; i += 1) {
      const cx = px + 6 + i * 9 + seeded(x, y, i + 60) * 5;
      blob(cx, py + 2 - seeded(x, y, i + 69) * 5, 8, 5, bank);
      blob(cx + 2, py + 8, 5, 2, foam);
    }
  }
}

function drawTile(x, y, type, now) {
  const px = x * TILE;
  const py = y * TILE;
  const colors = tileColors[type] || tileColors[TILES.grass];
  ctx.fillStyle = colors[0];
  ctx.fillRect(px, py, TILE, TILE);

  if (type === TILES.water) {
    drawWaterDetail(px, py, x, y, now);
  }

  if (type === TILES.dock) {
    ctx.fillStyle = "rgba(35, 21, 12, 0.32)";
    ctx.fillRect(px, py + 3, TILE, 5);
    ctx.fillRect(px, py + 29, TILE, 5);
    ctx.strokeStyle = "#4b3222";
    ctx.lineWidth = 2;
    for (let i = 8; i < TILE; i += 16) {
      ctx.beginPath();
      ctx.moveTo(px + i, py + 4);
      ctx.lineTo(px + i - 4, py + TILE - 4);
      ctx.stroke();
    }
  }

  if (type === TILES.portal) {
    const pulse = Math.sin(now / 180) * 0.5 + 0.5;
    ctx.fillStyle = "#21152f";
    ctx.fillRect(px + 8, py + 8, 32, 32);
    ctx.fillStyle = `rgba(132, 216, 255, ${0.35 + pulse * 0.28})`;
    ctx.fillRect(px + 13, py + 13, 22, 22);
    ctx.strokeStyle = "#d7c46a";
    ctx.lineWidth = 2;
    ctx.strokeRect(px + 10, py + 10, 28, 28);
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.4 + pulse * 0.35})`;
    ctx.beginPath();
    ctx.arc(px + 24, py + 24, 8 + pulse * 6, 0, Math.PI * 2);
    ctx.stroke();
  }

  if (type === TILES.grass) drawPixelGrass(px, py, x, y);
  if (type === TILES.sand) drawPixelSand(px, py, x, y);

  if (type === TILES.tree) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.28)";
    ctx.beginPath();
    ctx.ellipse(px + 24, py + 39, 19, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#5f3b21";
    ctx.fillRect(px + 20, py + 23, 9, 19);
    ctx.fillStyle = "#7a4c2a";
    ctx.fillRect(px + 23, py + 24, 3, 15);
    ctx.fillStyle = "#174d2d";
    ctx.fillRect(px + 12, py + 14, 24, 15);
    ctx.fillStyle = "#21683a";
    ctx.fillRect(px + 8, py + 20, 32, 12);
    ctx.fillStyle = "#2d8547";
    ctx.fillRect(px + 15, py + 8, 20, 13);
    ctx.fillStyle = "#0f3824";
    ctx.fillRect(px + 12, py + 29, 24, 5);
  }

  if (type === TILES.rock) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
    ctx.beginPath();
    ctx.ellipse(px + 24, py + 34, 18, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#696b65";
    ctx.fillRect(px + 13, py + 22, 23, 13);
    ctx.fillStyle = "#85877e";
    ctx.fillRect(px + 17, py + 17, 18, 10);
    ctx.fillStyle = "#a2a497";
    ctx.fillRect(px + 18, py + 18, 9, 3);
    ctx.fillStyle = "#4d504c";
    ctx.fillRect(px + 30, py + 29, 7, 5);
  }

  if (type === TILES.stump) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.24)";
    ctx.beginPath();
    ctx.ellipse(px + 24, py + 32, 15, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#6b4527";
    ctx.fillRect(px + 16, py + 22, 17, 12);
    ctx.fillStyle = "#a57442";
    ctx.fillRect(px + 14, py + 18, 21, 8);
    ctx.fillStyle = "#4b2f1d";
    ctx.fillRect(px + 20, py + 20, 9, 3);
  }

  if (type === TILES.dungeon) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.34)";
    ctx.beginPath();
    ctx.ellipse(px + 24, py + 39, 22, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#5f5b56";
    ctx.fillRect(px + 5, py + 12, 38, 30);
    ctx.fillStyle = "#817c72";
    ctx.fillRect(px + 4, py + 8, 40, 9);
    ctx.fillRect(px + 4, py + 17, 8, 25);
    ctx.fillRect(px + 36, py + 17, 8, 25);
    ctx.fillStyle = "#2a2522";
    ctx.fillRect(px + 14, py + 22, 20, 20);
    ctx.fillStyle = "#3a332e";
    ctx.fillRect(px + 17, py + 25, 14, 17);
    ctx.fillStyle = "#9d978c";
    ctx.fillRect(px + 9, py + 10, 10, 3);
    ctx.fillRect(px + 28, py + 10, 10, 3);
    ctx.fillStyle = "#4b4742";
    ctx.fillRect(px + 13, py + 18, 5, 4);
    ctx.fillRect(px + 31, py + 18, 5, 4);
    ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
    ctx.fillRect(px + 16, py + 39, 16, 3);
  }

  if (type === TILES.stationFloor) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.12)";
    ctx.fillRect(px, py + 38, TILE, 10);
    for (let i = 0; i < 5; i += 1) {
      ctx.fillStyle = seeded(x, y, i + 200) > 0.5 ? "#565047" : "#2d2a26";
      ctx.fillRect(px + Math.floor(seeded(x, y, i + 210) * 42), py + Math.floor(seeded(x, y, i + 220) * 42), 3, 2);
    }
  }

  if (type === TILES.stationWall) {
    ctx.fillStyle = "#4f4b45";
    ctx.fillRect(px, py, TILE, TILE);
    ctx.fillStyle = "#777268";
    ctx.fillRect(px, py, TILE, 8);
    ctx.fillStyle = "#36322d";
    ctx.fillRect(px + 8, py + 18, 10, 16);
    ctx.fillRect(px + 30, py + 18, 8, 16);
    ctx.fillStyle = "#8c867b";
    ctx.fillRect(px + 10, py + 20, 6, 3);
    ctx.fillStyle = "rgba(35, 80, 42, 0.5)";
    ctx.fillRect(px + 2, py + 5 + Math.floor(seeded(x, y, 3) * 12), 4, 19);
    ctx.fillRect(px + 40, py + 12, 3, 21);
  }

  if (type === TILES.stationDoor) {
    ctx.fillStyle = "#57524b";
    ctx.fillRect(px, py, TILE, TILE);
    ctx.fillStyle = "#8a8478";
    ctx.fillRect(px + 4, py + 6, 40, 8);
    ctx.fillStyle = "#241f1b";
    ctx.fillRect(px + 12, py + 14, 24, 29);
    ctx.fillStyle = "#141210";
    ctx.fillRect(px + 16, py + 19, 16, 24);
    ctx.fillStyle = "#766f64";
    ctx.fillRect(px + 8, py + 14, 5, 30);
    ctx.fillRect(px + 35, py + 14, 5, 30);
  }

  if (type === TILES.platform) {
    ctx.fillStyle = "#6a5f4e";
    ctx.fillRect(px, py, TILE, TILE);
    ctx.fillStyle = "#97896f";
    ctx.fillRect(px, py + 4, TILE, 5);
    ctx.fillStyle = "#3a342d";
    ctx.fillRect(px, py + TILE - 7, TILE, 7);
    ctx.fillStyle = "rgba(226, 190, 88, 0.55)";
    ctx.fillRect(px + 2, py + 10, TILE - 4, 3);
  }

  if (type === TILES.rail) {
    ctx.fillStyle = "#24221f";
    ctx.fillRect(px, py, TILE, TILE);
    ctx.fillStyle = "#5f5a52";
    ctx.fillRect(px, py + 10, TILE, 4);
    ctx.fillRect(px, py + 32, TILE, 4);
    ctx.fillStyle = "#3f2b1a";
    for (let i = 0; i < 3; i += 1) {
      ctx.fillRect(px + i * 18 + 2, py + 6, 5, 34);
    }
    ctx.fillStyle = "rgba(55, 90, 50, 0.38)";
    ctx.fillRect(px + 4, py + 20, 9, 3);
    ctx.fillRect(px + 31, py + 25, 11, 3);
  }

  if (type === TILES.bridge) {
    ctx.fillStyle = "#343331";
    ctx.fillRect(px, py, TILE, TILE);
    ctx.strokeStyle = "#1d1c1b";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(px, py + 12);
    ctx.lineTo(px + TILE, py + 36);
    ctx.moveTo(px, py + 36);
    ctx.lineTo(px + TILE, py + 12);
    ctx.moveTo(px, py + 24);
    ctx.lineTo(px + TILE, py + 24);
    ctx.stroke();
    ctx.fillStyle = "#6a6761";
    ctx.fillRect(px, py + 8, TILE, 4);
    ctx.fillRect(px, py + 36, TILE, 4);
  }

  if (type === TILES.debris) {
    ctx.fillStyle = "#3f3b35";
    ctx.fillRect(px, py, TILE, TILE);
    ctx.fillStyle = "#6d604d";
    ctx.fillRect(px + 12, py + 27, 24, 5);
    ctx.fillStyle = "#34251b";
    ctx.fillRect(px + 15, py + 22, 18, 5);
    ctx.fillStyle = "rgba(52, 100, 54, 0.58)";
    ctx.fillRect(px + 8, py + 16, 5, 18);
    ctx.fillRect(px + 33, py + 14, 4, 20);
  }

  drawCoastEdges(px, py, x, y, type);
}

function drawBoat() {
  if (state.inBoat && player.facing === "down") {
    drawBoatDown();
    return;
  }

  if (state.inBoat && player.facing === "up") {
    drawVerticalBoat();
    return;
  }

  const x = state.inBoat ? player.x - 20 : boat.x - 7;
  const y = state.inBoat ? player.y - 10 : boat.y - 6;
  const w = state.inBoat ? 64 : 48;
  const h = state.inBoat ? 48 : 38;
  const flip = state.inBoat && player.facing === "left";

  ctx.fillStyle = "rgba(0, 0, 0, 0.34)";
  ctx.beginPath();
  ctx.ellipse(x + w / 2, y + h - 7, w / 2 - 3, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  if (flip) {
    ctx.translate(x + w, 0);
    ctx.scale(-1, 1);
    ctx.translate(-x, 0);
  }

  // Mast and small sail, styled like a classic 2D MMORPG boat sprite.
  ctx.fillStyle = "#3a2517";
  ctx.fillRect(x + Math.floor(w / 2) - 2, y + 5, 4, 31);
  ctx.fillStyle = "#d7caa3";
  ctx.beginPath();
  ctx.moveTo(x + w / 2 + 3, y + 8);
  ctx.lineTo(x + w / 2 + 18, y + 25);
  ctx.lineTo(x + w / 2 + 3, y + 28);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "rgba(255, 255, 255, 0.26)";
  ctx.fillRect(x + w / 2 + 6, y + 12, 3, 11);

  ctx.fillStyle = "#4b2a16";
  ctx.beginPath();
  ctx.moveTo(x + 3, y + h - 18);
  ctx.lineTo(x + w - 3, y + h - 18);
  ctx.lineTo(x + w - 11, y + h - 6);
  ctx.lineTo(x + 10, y + h - 5);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#b35f1f";
  ctx.beginPath();
  ctx.moveTo(x + 6, y + h - 20);
  ctx.lineTo(x + w - 6, y + h - 20);
  ctx.lineTo(x + w - 13, y + h - 10);
  ctx.lineTo(x + 13, y + h - 9);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#e18a2f";
  ctx.fillRect(x + 12, y + h - 19, w - 24, 4);
  ctx.fillStyle = "#6e3917";
  ctx.fillRect(x + 10, y + h - 11, w - 20, 3);
  ctx.fillStyle = "#f0ac4a";
  ctx.fillRect(x + 16, y + h - 18, 13, 2);

  if (state.inBoat) {
    ctx.fillStyle = "#6b3f28";
    ctx.fillRect(x + 13, y + h - 31, 10, 9);
    ctx.fillStyle = "#111111";
    ctx.fillRect(x + 11, y + h - 35, 14, 5);
    ctx.fillStyle = "#169b3a";
    ctx.fillRect(x + 11, y + h - 23, 14, 6);
    ctx.fillStyle = "#ffdf00";
    ctx.fillRect(x + 13, y + h - 22, 10, 2);
    ctx.fillStyle = "#17429b";
    ctx.fillRect(x + 14, y + h - 17, 8, 4);
  }
  ctx.restore();
}

function drawVerticalBoat() {
  const x = player.x - 10;
  const y = player.y - 18;
  const w = 44;
  const h = 68;
  const goingUp = player.facing === "up";

  ctx.fillStyle = "rgba(0, 0, 0, 0.34)";
  ctx.beginPath();
  ctx.ellipse(x + w / 2, y + h - 13, 13, 28, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#3a2517";
  ctx.fillRect(x + w / 2 - 2, y + 9, 4, 40);
  ctx.fillStyle = "#d7caa3";
  ctx.beginPath();
  if (goingUp) {
    ctx.moveTo(x + w / 2 + 3, y + 10);
    ctx.lineTo(x + w / 2 + 16, y + 29);
    ctx.lineTo(x + w / 2 + 3, y + 34);
  } else {
    ctx.moveTo(x + w / 2 - 3, y + 13);
    ctx.lineTo(x + w / 2 - 16, y + 34);
    ctx.lineTo(x + w / 2 - 3, y + 38);
  }
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#4b2a16";
  ctx.beginPath();
  ctx.moveTo(x + w / 2, y + 3);
  ctx.lineTo(x + w - 7, y + 18);
  ctx.lineTo(x + w - 10, y + h - 9);
  ctx.lineTo(x + w / 2, y + h - 3);
  ctx.lineTo(x + 10, y + h - 9);
  ctx.lineTo(x + 7, y + 18);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#b35f1f";
  ctx.beginPath();
  ctx.moveTo(x + w / 2, y + 7);
  ctx.lineTo(x + w - 11, y + 21);
  ctx.lineTo(x + w - 13, y + h - 13);
  ctx.lineTo(x + w / 2, y + h - 8);
  ctx.lineTo(x + 13, y + h - 13);
  ctx.lineTo(x + 11, y + 21);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#e18a2f";
  ctx.fillRect(x + 15, y + 21, 14, 4);
  ctx.fillRect(x + 14, y + h - 20, 16, 4);
  ctx.fillStyle = "#6e3917";
  ctx.fillRect(x + 13, y + h - 12, 18, 3);

  ctx.fillStyle = "#6b3f28";
  ctx.fillRect(x + w / 2 - 5, y + 31, 10, 9);
  ctx.fillStyle = "#111111";
  ctx.fillRect(x + w / 2 - 7, y + 27, 14, 5);
  ctx.fillStyle = "#169b3a";
  ctx.fillRect(x + w / 2 - 7, y + 40, 14, 6);
  ctx.fillStyle = "#ffdf00";
  ctx.fillRect(x + w / 2 - 5, y + 41, 10, 2);
  ctx.fillStyle = "#17429b";
  ctx.fillRect(x + w / 2 - 4, y + 46, 8, 4);
}

function drawBoatDown() {
  const x = player.x - 14;
  const y = player.y - 15;
  const w = 52;
  const h = 70;

  ctx.fillStyle = "rgba(0, 0, 0, 0.36)";
  ctx.beginPath();
  ctx.ellipse(x + w / 2, y + h - 12, 21, 14, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#3a2517";
  ctx.fillRect(x + w / 2 - 2, y + 8, 4, 43);
  ctx.fillStyle = "#d7caa3";
  ctx.beginPath();
  ctx.moveTo(x + w / 2 - 3, y + 15);
  ctx.lineTo(x + w / 2 - 21, y + 37);
  ctx.lineTo(x + w / 2 - 4, y + 42);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "rgba(255, 255, 255, 0.24)";
  ctx.fillRect(x + w / 2 - 11, y + 23, 3, 12);

  ctx.fillStyle = "#4b2a16";
  ctx.beginPath();
  ctx.moveTo(x + w / 2, y + 7);
  ctx.lineTo(x + w - 14, y + 18);
  ctx.lineTo(x + w - 5, y + h - 18);
  ctx.lineTo(x + w / 2, y + h - 3);
  ctx.lineTo(x + 5, y + h - 18);
  ctx.lineTo(x + 14, y + 18);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#b35f1f";
  ctx.beginPath();
  ctx.moveTo(x + w / 2, y + 12);
  ctx.lineTo(x + w - 17, y + 23);
  ctx.lineTo(x + w - 10, y + h - 21);
  ctx.lineTo(x + w / 2, y + h - 9);
  ctx.lineTo(x + 10, y + h - 21);
  ctx.lineTo(x + 17, y + 23);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#e18a2f";
  ctx.fillRect(x + 16, y + 25, 20, 4);
  ctx.fillRect(x + 12, y + h - 24, 28, 5);
  ctx.fillStyle = "#6e3917";
  ctx.fillRect(x + 9, y + h - 17, 34, 4);
  ctx.fillStyle = "#f0ac4a";
  ctx.fillRect(x + 15, y + h - 23, 11, 2);

  ctx.fillStyle = "#6b3f28";
  ctx.fillRect(x + w / 2 - 5, y + 34, 10, 9);
  ctx.fillStyle = "#111111";
  ctx.fillRect(x + w / 2 - 8, y + 30, 16, 5);
  ctx.fillRect(x + w / 2 - 7, y + 34, 4, 5);
  ctx.fillRect(x + w / 2 + 4, y + 34, 4, 5);
  ctx.fillStyle = "#101218";
  ctx.fillRect(x + w / 2 - 4, y + 38, 3, 2);
  ctx.fillRect(x + w / 2 + 2, y + 38, 3, 2);
  ctx.fillStyle = "#169b3a";
  ctx.fillRect(x + w / 2 - 8, y + 43, 16, 7);
  ctx.fillStyle = "#ffdf00";
  ctx.fillRect(x + w / 2 - 6, y + 44, 12, 2);
  ctx.fillStyle = "#17429b";
  ctx.fillRect(x + w / 2 - 5, y + 50, 10, 5);
}

function drawBoatFront() {
  if (!state.inBoat) return;
  const x = player.x - 15;
  const y = player.y - 5;
  const w = 54;
  ctx.fillStyle = "#2b1a12";
  ctx.fillRect(x + 10, y + 33, w - 20, 6);
  ctx.fillStyle = "#9a6b3d";
  ctx.fillRect(x + 14, y + 29, w - 28, 5);
  ctx.fillStyle = "rgba(232, 198, 137, 0.36)";
  ctx.fillRect(x + 16, y + 30, 8, 2);
}

function drawPlayer() {
  if (state.inBoat) return;

  const x = player.x;
  const y = player.y;
  ctx.fillStyle = "rgba(0, 0, 0, 0.28)";
  ctx.beginPath();
  ctx.ellipse(x + 12, y + 33, 13, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#17429b";
  ctx.fillRect(x + 6, y + 28, 5, 8);
  ctx.fillRect(x + 15, y + 28, 5, 8);
  ctx.fillStyle = "#123072";
  ctx.fillRect(x + 6, y + 34, 6, 3);
  ctx.fillRect(x + 14, y + 34, 7, 3);

  ctx.fillStyle = "#169b3a";
  ctx.fillRect(x + 4, y + 14, 17, 15);
  ctx.fillStyle = "#ffdf00";
  ctx.fillRect(x + 7, y + 15, 12, 5);
  ctx.fillStyle = "#0f6f2f";
  ctx.fillRect(x + 4, y + 25, 17, 4);
  ctx.fillStyle = "#6b3f28";
  ctx.fillRect(x + 3, y + 17, 4, 9);
  ctx.fillRect(x + 19, y + 17, 4, 9);

  ctx.fillStyle = "#6b3f28";
  ctx.fillRect(x + 6, y + 5, 14, 11);
  ctx.fillStyle = "#8b5638";
  ctx.fillRect(x + 9, y + 7, 8, 4);
  ctx.fillStyle = "#111111";
  ctx.fillRect(x + 3, y + 1, 20, 6);
  ctx.fillRect(x + 4, y + 5, 5, 5);
  ctx.fillRect(x + 18, y + 5, 4, 6);
  ctx.fillRect(x + 7, y, 12, 3);

  ctx.fillStyle = "#101218";
  if (player.facing === "left") ctx.fillRect(x + 7, y + 10, 3, 3);
  if (player.facing === "right") ctx.fillRect(x + 16, y + 10, 3, 3);
  if (player.facing === "up") ctx.fillRect(x + 9, y + 7, 8, 3);
  if (player.facing === "down") {
    ctx.fillRect(x + 8, y + 10, 3, 3);
    ctx.fillRect(x + 16, y + 10, 3, 3);
    ctx.fillStyle = "#3f2419";
    ctx.fillRect(x + 12, y + 13, 4, 2);
  }

  if (state.equippedWeapon === "basicSword") {
    ctx.strokeStyle = "#d8d2bd";
    ctx.lineWidth = 2;
    ctx.beginPath();
    if (player.facing === "left") {
      ctx.moveTo(x + 4, y + 22);
      ctx.lineTo(x - 7, y + 17);
    } else if (player.facing === "right") {
      ctx.moveTo(x + 22, y + 22);
      ctx.lineTo(x + 33, y + 17);
    } else if (player.facing === "up") {
      ctx.moveTo(x + 19, y + 16);
      ctx.lineTo(x + 25, y + 4);
    } else {
      ctx.moveTo(x + 20, y + 22);
      ctx.lineTo(x + 28, y + 32);
    }
    ctx.stroke();
    ctx.fillStyle = "#8d6a32";
    ctx.fillRect(x + 18, y + 20, 4, 4);
  }

  ctx.font = "13px Trebuchet MS, Verdana, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.lineWidth = 3;
  ctx.strokeStyle = "rgba(0, 0, 0, 0.85)";
  ctx.fillStyle = "#ffffff";
  ctx.strokeText(state.characterName, x + player.w / 2, y + player.h + 4);
  ctx.fillText(state.characterName, x + player.w / 2, y + player.h + 4);
  ctx.textAlign = "start";
}

function drawSingleNpc(npc, tunic, tunicLight, tunicDark) {
  const x = npc.x;
  const y = npc.y;

  ctx.fillStyle = "rgba(0, 0, 0, 0.28)";
  ctx.beginPath();
  ctx.ellipse(x + 12, y + 33, 13, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#2d241d";
  ctx.fillRect(x + 6, y + 28, 5, 8);
  ctx.fillRect(x + 15, y + 28, 5, 8);
  ctx.fillStyle = "#5a3a24";
  ctx.fillRect(x + 5, y + 34, 7, 3);
  ctx.fillRect(x + 14, y + 34, 7, 3);

  ctx.fillStyle = tunic;
  ctx.fillRect(x + 4, y + 14, 17, 15);
  ctx.fillStyle = tunicLight;
  ctx.fillRect(x + 7, y + 15, 12, 5);
  ctx.fillStyle = tunicDark;
  ctx.fillRect(x + 4, y + 25, 17, 4);
  ctx.fillStyle = "#c49b67";
  ctx.fillRect(x + 3, y + 17, 4, 9);
  ctx.fillRect(x + 19, y + 17, 4, 9);

  ctx.fillStyle = "#c99763";
  ctx.fillRect(x + 6, y + 5, 14, 11);
  ctx.fillStyle = "#e0b985";
  ctx.fillRect(x + 9, y + 7, 8, 4);
  ctx.fillStyle = "#4a3720";
  ctx.fillRect(x + 4, y + 1, 18, 6);
  ctx.fillStyle = "#101218";
  ctx.fillRect(x + 8, y + 10, 3, 3);
  ctx.fillRect(x + 16, y + 10, 3, 3);
  ctx.fillStyle = "#7d4e32";
  ctx.fillRect(x + 12, y + 13, 4, 2);

  ctx.font = "13px Trebuchet MS, Verdana, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.lineWidth = 3;
  ctx.strokeStyle = "rgba(0, 0, 0, 0.85)";
  ctx.fillStyle = "#ffffff";
  ctx.strokeText(npc.name, x + npc.w / 2, y + npc.h + 4);
  ctx.fillText(npc.name, x + npc.w / 2, y + npc.h + 4);
  ctx.textAlign = "start";
}

function drawNpc() {
  if (state.mapName !== "river") return;
  drawSingleNpc(lumberjackNpc, "#7b4b2d", "#9b6841", "#57331f");
  drawSingleNpc(fisherNpc, "#6b6a3a", "#8b8848", "#4f4f2a");
  drawSingleNpc(vendorNpc, "#345f6c", "#4f8796", "#24444f");
}

function drawCreatures() {
  for (const creature of creatures) {
    if (creature.mapName !== state.mapName || creature.hp <= 0) continue;
    const x = creature.x;
    const y = creature.y;
    const fade = Math.min((performance.now() - creature.spawnedAt) / 900, 1);

    ctx.save();
    ctx.globalAlpha = fade;
    ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
    ctx.beginPath();
    ctx.ellipse(x + creature.w / 2, y + creature.h - 1, 14, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#3b332c";
    ctx.fillRect(x + 5, y + 10, 15, 14);
    ctx.fillStyle = "#5b4a3d";
    ctx.fillRect(x + 3, y + 7, 19, 10);
    ctx.fillStyle = "#2a211c";
    ctx.fillRect(x + 2, y + 5, 5, 5);
    ctx.fillRect(x + 18, y + 5, 5, 5);
    ctx.fillStyle = "#d7c06a";
    ctx.fillRect(x + 7, y + 11, 3, 3);
    ctx.fillRect(x + 15, y + 11, 3, 3);
    ctx.fillStyle = "#1a1411";
    ctx.fillRect(x + 11, y + 17, 5, 2);

    const barW = 30;
    const barX = x + creature.w / 2 - barW / 2;
    const barY = y + creature.h + 4;
    ctx.fillStyle = "rgba(0, 0, 0, 0.78)";
    ctx.fillRect(barX - 1, barY - 1, barW + 2, 6);
    ctx.fillStyle = "#4b1010";
    ctx.fillRect(barX, barY, barW, 4);
    ctx.fillStyle = "#d7322f";
    ctx.fillRect(barX, barY, barW * (creature.hp / creature.maxHp), 4);
    ctx.restore();
  }
}

function drawRemoteCharacter(other) {
  const x = other.x;
  const y = other.y;

  ctx.fillStyle = "rgba(0, 0, 0, 0.28)";
  ctx.beginPath();
  ctx.ellipse(x + 12, y + 33, 13, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#17429b";
  ctx.fillRect(x + 6, y + 28, 5, 8);
  ctx.fillRect(x + 15, y + 28, 5, 8);
  ctx.fillStyle = "#169b3a";
  ctx.fillRect(x + 4, y + 14, 17, 15);
  ctx.fillStyle = "#ffdf00";
  ctx.fillRect(x + 7, y + 15, 12, 5);
  ctx.fillStyle = "#6b3f28";
  ctx.fillRect(x + 6, y + 5, 14, 11);
  ctx.fillStyle = "#111";
  ctx.fillRect(x + 3, y + 1, 20, 6);

  if (other.equippedWeapon === "basicSword") {
    ctx.strokeStyle = "#d8d2bd";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + 22, y + 22);
    ctx.lineTo(x + 33, y + 17);
    ctx.stroke();
  }

  drawRemoteName(other.name, x + 12, y + 38);
}

function drawRemoteBoat(other) {
  const x = other.x - 20;
  const y = other.y - 10;
  ctx.fillStyle = "rgba(0, 0, 0, 0.34)";
  ctx.beginPath();
  ctx.ellipse(x + 32, y + 41, 29, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#3a2517";
  ctx.fillRect(x + 30, y + 5, 4, 31);
  ctx.fillStyle = "#d7caa3";
  ctx.beginPath();
  ctx.moveTo(x + 35, y + 8);
  ctx.lineTo(x + 50, y + 25);
  ctx.lineTo(x + 35, y + 28);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#4b2a16";
  ctx.fillRect(x + 6, y + 28, 52, 12);
  ctx.fillStyle = "#b35f1f";
  ctx.fillRect(x + 10, y + 26, 44, 9);
  ctx.fillStyle = "#e18a2f";
  ctx.fillRect(x + 14, y + 29, 36, 3);
  drawRemoteName(other.name, other.x + 12, other.y + 42);
}

function drawRemoteMeditationSmoke(other, now) {
  if (!other.meditating) return;
  const cx = other.x + 12;
  const baseY = other.y + 7;

  ctx.save();
  for (let i = 0; i < 6; i += 1) {
    const phase = ((now / 900 + i * 0.2) % 1);
    const drift = Math.sin(now / 260 + i * 1.7) * 9;
    const x = cx + drift + (i - 2.5) * 2;
    const y = baseY - phase * 38;
    const size = 4 + phase * 8 + (i % 2) * 2;
    const alpha = 0.42 * (1 - phase);
    ctx.fillStyle = `rgba(184, 221, 255, ${alpha})`;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawRemoteName(name, x, y) {
  ctx.font = "13px Trebuchet MS, Verdana, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.lineWidth = 3;
  ctx.strokeStyle = "rgba(0, 0, 0, 0.85)";
  ctx.fillStyle = "#ffffff";
  ctx.strokeText(name || "Jugador", x, y);
  ctx.fillText(name || "Jugador", x, y);
  ctx.textAlign = "start";
}

function drawSpeechBubble(text, x, y, age, life) {
  const alpha = age > life - 800 ? Math.max(0, 1 - (age - (life - 800)) / 800) : 1;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.font = "14px Trebuchet MS, Verdana, sans-serif";
  ctx.textBaseline = "top";

  const lines = wrapText(text, 190);
  const width = Math.min(220, Math.max(...lines.map((line) => ctx.measureText(line).width)) + 20);
  const height = lines.length * 17 + 12;
  const bx = Math.max(8, Math.min(canvas.width - width - 8, x - width / 2));
  const by = Math.max(8, y - height);

  ctx.fillStyle = "rgba(246, 240, 216, 0.94)";
  ctx.strokeStyle = "rgba(27, 31, 36, 0.82)";
  ctx.lineWidth = 2;
  ctx.fillRect(bx, by, width, height);
  ctx.strokeRect(bx, by, width, height);

  ctx.fillStyle = "rgba(246, 240, 216, 0.94)";
  ctx.beginPath();
  ctx.moveTo(x - 6, by + height - 1);
  ctx.lineTo(x + 6, by + height - 1);
  ctx.lineTo(x, by + height + 7);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#16191f";
  lines.forEach((line, index) => {
    ctx.fillText(line, bx + 10, by + 7 + index * 17);
  });
  ctx.restore();
}

function drawRemoteChatBubble(other, now) {
  if (!other.chatBubble) return;
  const age = (other.chatBubble.age || 0) + (now - (other.updatedAt || now));
  const life = other.chatBubble.life || 4200;
  if (age > life) return;
  drawSpeechBubble(other.chatBubble.text, other.x + 12, Math.max(18, other.y - 14), age, life);
}

function drawRemotePlayers() {
  if (!multiplayer.enabled || !state.inWorld) return;
  const now = performance.now();
  for (const other of multiplayer.others.values()) {
    if (other.mapName !== state.mapName) continue;
    if (other.inBoat) drawRemoteBoat(other);
    else drawRemoteCharacter(other);
    drawRemoteMeditationSmoke(other, now);
    drawRemoteChatBubble(other, now);
  }
}

function wrapText(text, maxWidth) {
  const words = text.split(" ");
  const lines = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, 3);
}

function drawChatBubble(now) {
  if (!state.chatBubble) return;

  const age = now - state.chatBubble.createdAt;
  const x = player.x + player.w / 2;
  const y = Math.max(18, player.y - 14);
  drawSpeechBubble(state.chatBubble.text, x, y, age, state.chatBubble.life);
}

function drawGoldPopup(now) {
  if (!state.goldPopup) return;

  const age = now - state.goldPopup.createdAt;
  const t = Math.min(age / state.goldPopup.life, 1);
  let alpha = 1;
  if (t < 0.2) alpha = t / 0.2;
  if (t > 0.72) alpha = Math.max(0, 1 - (t - 0.72) / 0.28);

  const enterDrop = t < 0.2 ? -18 + 18 * (t / 0.2) : 0;
  const exitRise = t > 0.72 ? -22 * ((t - 0.72) / 0.28) : 0;
  const x = player.x + player.w / 2;
  const y = Math.max(16, player.y - 28 + enterDrop + exitRise);
  const text = `🪙 +${state.goldPopup.amount}`;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.font = "bold 16px Trebuchet MS, Verdana, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineWidth = 4;
  ctx.strokeStyle = "rgba(41, 25, 8, 0.9)";
  ctx.fillStyle = "#ffd65a";
  ctx.strokeText(text, x, y);
  ctx.fillText(text, x, y);
  ctx.textAlign = "start";
  ctx.restore();
}

function drawPunchFx(now) {
  if (!state.punchFx) return;
  const age = now - state.punchFx.createdAt;
  const t = Math.min(age / state.punchFx.life, 1);
  ctx.save();
  ctx.globalAlpha = 1 - t;
  ctx.strokeStyle = "#f4eedc";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(state.punchFx.x, state.punchFx.y, 8 + t * 14, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawCombatPopup(now) {
  if (!state.combatPopup) return;
  const age = now - state.combatPopup.createdAt;
  const t = Math.min(age / state.combatPopup.life, 1);
  ctx.save();
  ctx.globalAlpha = 1 - t;
  ctx.font = "bold 15px Trebuchet MS, Verdana, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineWidth = 3;
  ctx.strokeStyle = "rgba(0, 0, 0, 0.82)";
  ctx.fillStyle = state.combatPopup.text === "miss" ? "#d6d0c2" : "#ffdf00";
  ctx.strokeText(state.combatPopup.text, state.combatPopup.x, state.combatPopup.y - t * 22);
  ctx.fillText(state.combatPopup.text, state.combatPopup.x, state.combatPopup.y - t * 22);
  ctx.textAlign = "start";
  ctx.restore();
}

function drawMapTitle(now) {
  if (!state.mapTitle) return;

  const age = now - state.mapTitle.createdAt;
  const t = Math.min(age / state.mapTitle.life, 1);
  let alpha = 1;
  if (t < 0.18) alpha = t / 0.18;
  if (t > 0.68) alpha = Math.max(0, 1 - (t - 0.68) / 0.32);

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.font = "bold 34px Trebuchet MS, Verdana, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineWidth = 5;
  ctx.strokeStyle = "rgba(0, 0, 0, 0.72)";
  ctx.fillStyle = "#f4eedc";
  ctx.strokeText(state.mapTitle.text, canvas.width / 2, canvas.height / 2);
  ctx.fillText(state.mapTitle.text, canvas.width / 2, canvas.height / 2);
  ctx.textAlign = "start";
  ctx.restore();
}

function drawDungeonAtmosphere() {
  if (state.mapName !== "coghlanDungeon") return;

  ctx.save();
  ctx.fillStyle = "rgba(19, 17, 15, 0.24)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const glow = ctx.createRadialGradient(canvas.width / 2, 160, 30, canvas.width / 2, 160, 330);
  glow.addColorStop(0, "rgba(210, 190, 145, 0.16)");
  glow.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "rgba(0, 0, 0, 0.28)";
  ctx.fillRect(0, 0, canvas.width, 18);
  ctx.fillRect(0, canvas.height - 22, canvas.width, 22);
  ctx.restore();
}

function drawMeditationSmoke(now) {
  if (!state.meditating) return;

  const cx = player.x + player.w / 2;
  const baseY = player.y + 7;

  ctx.save();
  for (let i = 0; i < 7; i += 1) {
    const phase = ((now / 900 + i * 0.19) % 1);
    const drift = Math.sin(now / 260 + i * 1.8) * 10;
    const x = cx + drift + (i - 3) * 2;
    const y = baseY - phase * 42;
    const size = 5 + phase * 9 + (i % 2) * 2;
    const alpha = 0.48 * (1 - phase);
    ctx.fillStyle = `rgba(184, 221, 255, ${alpha})`;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.55})`;
    ctx.fillRect(x - 1, y - 1, 2, 2);
  }

  ctx.strokeStyle = "rgba(108, 189, 255, 0.55)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(cx, player.y + player.h - 3, 18 + Math.sin(now / 180) * 3, 6, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawChoppingTarget() {
  if (!state.autoChopping || !state.choppingTarget || state.mapName !== "forest") return;
  const { tx, ty } = state.choppingTarget;
  const health = Math.max(0, getTreeHealth(tx, ty));
  const px = tx * TILE;
  const py = ty * TILE;

  ctx.fillStyle = "rgba(0, 0, 0, 0.72)";
  ctx.fillRect(px + 7, py + 4, 34, 6);
  ctx.fillStyle = "#7a241d";
  ctx.fillRect(px + 8, py + 5, 32, 4);
  ctx.fillStyle = "#d9b44a";
  ctx.fillRect(px + 8, py + 5, 32 * (health / TREE_MAX_HEALTH), 4);
}

function drawOverlays(now) {
  if (state.line) {
    const px = player.x + player.w / 2;
    const py = player.y + 16;
    ctx.strokeStyle = "rgba(36, 28, 18, 0.6)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(px + 1, py + 1);
    ctx.lineTo(state.line.x + 1, state.line.y + 1);
    ctx.stroke();
    ctx.strokeStyle = "rgba(245, 238, 220, 0.82)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(state.line.x, state.line.y);
    ctx.stroke();

    const bob = Math.sin(now / 120) * 3;
    ctx.fillStyle = "#d34035";
    ctx.fillRect(state.line.x - 3, state.line.y - 6 + bob, 6, 6);
    ctx.fillStyle = "#f8f0d8";
    ctx.fillRect(state.line.x - 3, state.line.y + bob, 6, 5);
  }

  for (const b of state.bobbers) {
    ctx.strokeStyle = `rgba(255, 255, 255, ${b.life * 0.35})`;
    ctx.beginPath();
    ctx.arc(b.x, b.y, (1 - b.life) * 24 + 5, 0, Math.PI * 2);
    ctx.stroke();
  }

  for (const r of state.ripples) {
    ctx.strokeStyle = r.color === "wood" ? `rgba(226, 181, 92, ${r.life * 0.65})` : `rgba(228, 246, 255, ${r.life * 0.55})`;
    ctx.beginPath();
    ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function draw() {
  const now = performance.now();
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let y = 0; y < MAP_H; y += 1) {
    for (let x = 0; x < MAP_W; x += 1) {
      drawTile(x, y, maps[state.mapName][y][x], now);
    }
  }

  if (["river", "island"].includes(state.mapName) && state.inBoat) drawBoat();
  drawNpc();
  drawCreatures();
  drawRemotePlayers();
  drawPlayer();
  drawDungeonAtmosphere();
  drawMeditationSmoke(now);
  drawChoppingTarget();
  drawChatBubble(now);
  drawGoldPopup(now);
  drawPunchFx(now);
  drawCombatPopup(now);
  drawOverlays(now);
  drawMapTitle(now);
}

function loop(now) {
  const dt = Math.min((now - state.lastTime) / 1000, 0.05);
  state.lastTime = now;
  update(dt, now);
  draw();
  requestAnimationFrame(loop);
}

window.addEventListener("keydown", (event) => {
  if (!state.inWorld) return;
  if (state.chatting) return;
  if (event.key === "Enter") {
    event.preventDefault();
    openChat();
    return;
  }
  if (event.key === "3" && !event.repeat) {
    event.preventDefault();
    state.holdingAttack = true;
    punch();
    return;
  }
  if (event.key === "3") {
    event.preventDefault();
    state.holdingAttack = true;
    return;
  }
  keys.add(event.key.toLowerCase());
  if (event.key.toLowerCase() === "e" && !event.repeat) toggleBoatMode();
});

window.addEventListener("keyup", (event) => {
  if (!state.inWorld) return;
  if (event.key === "3") {
    state.holdingAttack = false;
    return;
  }
  keys.delete(event.key.toLowerCase());
});

canvas.addEventListener("contextmenu", (event) => {
  event.preventDefault();
  if (!state.inWorld) return;
  if (state.chatting) return;
  const pos = screenToWorld(event);

  if (tileAt(pos.x, pos.y) === TILES.portal) {
    activatePortal();
    return;
  }

  if (state.autoChopping) {
    stopAutoChopping("Dejaste de talar.");
    return;
  }

  if (chopTreeAt(pos.x, pos.y)) return;

  if (state.mapName === "river" && pointInRect(pos.x, pos.y, vendorNpc)) {
    if (state.autoFishing || state.fishing) stopAutoFishing("Dejaste de pescar.");
    if (state.autoChopping) stopAutoChopping("Dejaste de talar.");
    stopMeditating("Dejaste de meditar.");
    openShop();
    return;
  }

  if (state.mapName === "river" && pointInRect(pos.x, pos.y, lumberjackNpc)) {
    if (state.autoFishing || state.fishing) stopAutoFishing("Dejaste de pescar.");
    if (state.autoChopping) stopAutoChopping("Dejaste de talar.");
    stopMeditating("Dejaste de meditar.");
    sellWoodToNpc();
    return;
  }

  if (state.mapName === "river" && pointInRect(pos.x, pos.y, fisherNpc)) {
    if (state.autoFishing || state.fishing) stopAutoFishing("Dejaste de pescar.");
    if (state.autoChopping) stopAutoChopping("Dejaste de talar.");
    stopMeditating("Dejaste de meditar.");
    sellFishToNpc();
    return;
  }
  if (state.autoFishing || state.fishing) {
    stopAutoFishing("Dejaste de pescar.");
    return;
  }
  if (state.mapName !== "river") {
    setMessage("Click derecho a un arbol cercano para talar.");
    return;
  }
  stopMeditating("Dejaste de meditar.");
  startAutoFishing(pos.x, pos.y);
});

chatInput.addEventListener("keydown", (event) => {
  event.stopPropagation();
  if (event.key === "Enter") {
    event.preventDefault();
    sendChat();
  }
  if (event.key === "Escape") {
    event.preventDefault();
    closeChat();
    setMessage("Chat cancelado.");
  }
});

closeShop.addEventListener("click", closeShopWindow);
buySword.addEventListener("click", buyBasicSword);

enterWorld.addEventListener("click", enterSelectedCharacter);
createCharacter.addEventListener("click", () => {
  creationPanel.classList.add("is-open");
  characterName.focus();
});
confirmCreate.addEventListener("click", createSelectedCharacter);
characterName.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    createSelectedCharacter();
  }
});

toggleBoat.addEventListener("click", toggleBoatMode);
backToCharacters.addEventListener("click", () => {
  if (!state.inWorld) {
    characterMenu.classList.remove("is-hidden");
    return;
  }
  returnToCharacterMenu(`${state.characterName} salio del mundo.`);
});

resetGame.addEventListener("click", () => {
  maps.forest = maps.forest.map((row) => row.map((tile) => (tile === TILES.stump ? TILES.tree : tile)));
  creatures.forEach((creature) => {
    creature.hp = creature.maxHp;
    creature.respawnAt = 0;
    creature.spawnedAt = performance.now();
  });
  state.fish = 0;
  state.gold = 0;
  state.wood = 0;
  state.energy = MAX_ENERGY;
  state.mana = 35;
  state.hasSword = false;
  state.equippedWeapon = "fists";
  state.shopOpen = false;
  state.mapName = "river";
  state.inBoat = false;
  state.autoFishing = false;
  state.fishing = false;
  state.fishingSpot = null;
  state.autoChopping = false;
  state.choppingTarget = null;
  state.choppingTickAt = 0;
  state.treeHealth = {};
  state.meditating = false;
  state.chatting = false;
  state.chatBubble = null;
  state.goldPopup = null;
  state.combatPopup = null;
  state.punchFx = null;
  state.lastPunchAt = -PUNCH_COOLDOWN;
  state.holdingAttack = false;
  state.characterName = characters[selectedCharacterSlot]?.name || "Khan";
  state.mapTitle = null;
  state.line = null;
  closeChat();
  closeShopWindow();
  boat.x = boat.dockX;
  boat.y = boat.dockY;
  player.x = 4 * TILE + 12;
  player.y = 6 * TILE + 8;
  player.facing = "down";
  toggleBoat.textContent = "Barca automatica";
  updateStats();
  setMessage("Nueva jornada de pesca.");
});

updateStats();
renderCharacterSlots();
requestAnimationFrame(loop);
