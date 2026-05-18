# Mini AO Coghlan

Mini juego 2D inspirado en los clasicos argentinos tipo Argentum Online / Imperium AO.

## Features

- Seleccion y creacion de personajes.
- Mapa principal con pesca automatica.
- Barca automatica al entrar al agua.
- Mapa de tala con venta manual de madera.
- Isla Coghlan y Dungeon Coghlan.
- Combate con punos o espada basica.
- Chat in-game y comando `/meditar`.
- Multiplayer local para probar en dos pestanas del navegador.

## Ejecutar local

```powershell
npm start
```

Despues abrir:

```text
http://localhost:3000/
```

## Deploy

El juego puede subirse a GitHub y luego importarse en Vercel como proyecto estatico.

Nota: el multiplayer actual sirve para pruebas locales. Para multiplayer online real en Vercel hace falta agregar un servicio realtime externo o un backend con WebSockets.
