# Multiplayer Platformer

Semester project for the **4IT573 – Základy Node.js** course.

The application is a real-time multiplayer platform game for two players. Players create an account, join matchmaking, move around a shared platform map, collect items and compete for the highest score before the time limit expires.

The project demonstrates several Node.js concepts covered during the course:

* web server development,
* REST API endpoints,
* WebSocket communication,
* asynchronous programming,
* file manipulation,
* relational databases,
* authentication and session management,
* automated testing.

## Main features

* user registration and login,
* persistent player accounts,
* authenticated WebSocket connections,
* matchmaking for two players,
* real-time communication using WebSockets,
* server-authoritative player movement,
* jumping, gravity and platform collisions,
* randomly spawning collectible items,
* score tracking and match timer,
* match result evaluation,
* player-specific match history,
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
│   ├── auth/               # Registration, login and session handling
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

Open the client in two separate browser tabs or windows.

Register or log in using a different account in each tab and click **Play**.

The first player waits in the matchmaking queue. The match starts automatically after the second player joins.

## Controls

| Key             | Action                                         |
| --------------- | ---------------------------------------------- |
| A / Left Arrow  | Move left                                      |
| D / Right Arrow | Move right                                     |
| W / Up Arrow    | Jump                                           |
| Q               | Join the matchmaking queue again after a match |
| M               | Return to the main menu                        |

## Authentication

User accounts are stored in the SQLite database.

Passwords are hashed before being stored. 

The client stores the token in `sessionStorage`. This allows different accounts to be used in separate browser tabs.

## HTTP endpoints

### `POST /auth/register`

Creates a new user account and authentication session.

### `POST /auth/login`

Authenticates an existing user and creates a new session.

### `GET /auth/me`

Returns the currently authenticated user.

The endpoint requires a valid token.

### `POST /auth/logout`

Invalidates the current authentication session.

The endpoint requires a valid token.

### `GET /matches`

Returns all stored matches ordered from newest to oldest.

This endpoint is used for global match data and leaderboard calculation.

Example response:

### `GET /matches/me`

Returns only matches involving the authenticated user.

### `GET /leaderboard`

Returns aggregated player statistics calculated from stored matches.

The client displays the top ten players. When a user is logged in, their own position is also displayed separately below the leaderboard.

## WebSocket communication

The WebSocket endpoint is:

```text
ws://localhost:3000/ws
```
### Server messages

The server sends messages for:

* connection establishment,
* successful authentication,
* matchmaking state,
* match start,
* real-time game state,
* match results,
* validation and authentication errors.


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

## Match history

The match history page displays only matches involving the currently authenticated user.

Each match is visually distinguished by its result:

* green for a win,
* red for a loss,
* blue for a draw.

## Leaderboard

* games played,
* wins,
* losses,
* draws,
* total score,
* win rate.

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

Current tests cover areas such as:

* WebSocket message validation,
* authentication message validation,
* join message validation,
* input message validation,
* queue message validation,
* malformed JSON,
* random item spawn selection,
* prevention of repeated item spawn positions,
* leaderboard statistics,
* leaderboard sorting,
* grouping leaderboard entries by user ID,
* empty leaderboard behaviour.

## Current limitations

* Reconnecting to an unfinished match is not supported.
* The game currently uses simple geometric shapes instead of animated sprites.
* Password changes and account recovery are not implemented.
* Matchmaking pairs players in arrival order and does not consider player skill.

## Possible future improvements

* reconnection to interrupted matches,
* skill-based matchmaking,
* password changes and account recovery,
* character sprites and animations,
* sound effects,
* power-ups and temporary player effects
