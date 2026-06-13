# Multiplayer Platformer

Semestral project for the **4IT573 – Základy Node.js** course.

The application is a real-time multiplayer platform game for two players. Players join matchmaking, move around a shared platform map, collect items and compete for the highest score before the time limit expires.

The project demonstrates several Node.js concepts covered during the course:

* web server,
* WebSockets,
* asynchronous programming,
* file manipulation,
* relational database,
* automated testing.

## Main features

* matchmaking for two players,
* real-time communication using WebSockets,
* server-authoritative player movement,
* jumping, gravity and platform collisions,
* randomly spawning collectible items,
* score tracking and match timer,
* match result evaluation,
* persistent match history in SQLite,
* leaderboard calculated from stored matches,
* nickname selection,
* ability to queue for another match,
* match history and leaderboard pages,
* automated tests using AVA.

## Technologies

### Backend

* Node.js
* TypeScript
* Hono
* `@hono/node-server`
* `@hono/node-ws`
* Drizzle ORM
* SQLite / libSQL
* AVA

### Client

* TypeScript
* Vite
* Phaser

## Project structure

```text
.
├── client/                 # Phaser and Vite client
├── data/                   # Game map configuration
├── drizzle/                # Database migrations
├── src/
│   ├── config/             # Game configuration loading and validation
│   ├── database/           # Database connection, schema and repositories
│   ├── game/               # Game rooms and gameplay logic
│   ├── leaderboard/        # Leaderboard calculation
│   └── websocket/          # WebSocket route and message validation
├── test/                   # AVA tests
├── drizzle.config.ts
├── package.json
└── tsconfig.json
```

## Requirements

* Node.js
* npm

## Installation

Clone the repository and install backend dependencies:

```bash
npm install
```

Install client dependencies:

```bash
cd client
npm install
cd ..
```

## Database setup

Generate migrations after changing the database schema:

```bash
npm run db:generate
```

Apply database migrations:

```bash
npm run db:migrate
```

The SQLite database is created locally and is not included in the repository.

## Running the application

### 1. Start the backend

From the project root:

```bash
npm run dev
```

The backend runs at:

```text
http://localhost:3000
```

### 2. Start the client

In another terminal:

```bash
cd client
npm run dev
```

The client normally runs at:

```text
http://localhost:5173
```

### 3. Start a match

Open the client in two browser windows or tabs.

Enter a different nickname in each window and click **Play**. The first player waits in the matchmaking queue. The match starts automatically after the second player joins.

## Controls

| Key             | Action                                         |
| --------------- | ---------------------------------------------- |
| A / Left Arrow  | Move left                                      |
| D / Right Arrow | Move right                                     |
| W / Up Arrow    | Jump                                           |
| Q               | Join the matchmaking queue again after a match |
| M               | Return to the main menu                        |

## HTTP endpoints

### `GET /matches`

Returns stored matches ordered from newest to oldest.

Example response:

```json
[
  {
    "id": 1,
    "player1Nickname": "Daniel",
    "player2Nickname": "Opponent",
    "player1Score": 3,
    "player2Score": 1,
    "winnerNickname": "Daniel",
    "playedAt": "2026-06-13T10:00:00.000Z"
  }
]
```

### `GET /leaderboard`

Returns aggregated player statistics calculated from stored matches.

Example response:

```json
[
  {
    "nickname": "Daniel",
    "gamesPlayed": 3,
    "wins": 2,
    "losses": 1,
    "draws": 0,
    "totalScore": 8,
    "winRate": 0.6666666667
  }
]
```

## WebSocket communication

The WebSocket endpoint is:

```text
ws://localhost:3000/ws
```

The client sends messages such as:

```json
{
  "type": "join",
  "nickname": "Daniel"
}
```

```json
{
  "type": "input",
  "input": {
    "left": false,
    "right": true,
    "jump": false
  }
}
```

```json
{
  "type": "queue"
}
```

The server sends connection, matchmaking, game state and match result messages.

## Game configuration

The map and gameplay configuration are stored in:

```text
data/default-map.json
```

The configuration contains:

* arena dimensions,
* player speed,
* gravity,
* jump velocity,
* ground position,
* match duration,
* player spawn points,
* item spawn points,
* platforms.

The file is loaded asynchronously using `node:fs/promises` and validated when the server starts.

## Building the project

Build the backend:

```bash
npm run build
```

Run the compiled backend:

```bash
npm start
```

Build the client:

```bash
cd client
npm run build
```

## Testing

The project uses AVA for automated tests.

Run all tests:

```bash
npm test
```

The command first compiles the TypeScript backend and then tests the generated JavaScript files.

Current tests cover:

* WebSocket message validation,
* valid and invalid join messages,
* input message validation,
* queue messages,
* malformed JSON,
* random item spawn selection,
* prevention of repeated item spawn positions,
* leaderboard statistics,
* leaderboard sorting,
* empty leaderboard behaviour.

## Current limitations

* Players are identified only by nicknames.
* There is no registration or authentication.
* Leaving a match disconnects the player and cancels the room.
* Reconnecting to an unfinished match is not supported.
* The game currently uses simple geometric shapes instead of animated sprites.
* The leaderboard treats identical nicknames as the same player.

## Possible future improvements

* user registration and login,
* persistent player accounts,
* linking matches to user IDs,
* authenticated WebSocket connections,
* player-specific match history,
* reconnection to interrupted matches,
* multiple maps,
* character sprites and animations,
* sound effects,
* improved matchmaking,
* additional game modes.
