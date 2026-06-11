import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import { createNodeWebSocket } from '@hono/node-ws'
import { serveStatic } from '@hono/node-server/serve-static'
import type { WSContext } from 'hono/ws'

const app = new Hono()

type PlayerId = string
type RoomId = string

type InputState = {
    up: boolean
    down: boolean
    left: boolean
    right: boolean
}

type Player = {
    id: PlayerId
    nickname: string
    x: number
    y: number
    score: number
    input: InputState
    ws: WSContext<WebSocket>
}

type Item = {
    x: number
    y: number
}

type Room = {
    id: RoomId
    players: Player[]
    item: Item
    startedAt: number
    durationMs: number
    intervalId?: NodeJS.Timeout
}

type ClientMessage =
    | { type: 'join'; nickname: string }
    | { type: 'input'; input: InputState }

const rooms = new Map<RoomId, Room>()
let waitingPlayer: Player | null = null

const ARENA_WIDTH = 800
const ARENA_HEIGHT = 600
const PLAYER_SPEED = 8
const PICKUP_DISTANCE = 30
const MATCH_DURATION_MS = 60_000

const randomId = () => crypto.randomUUID()

const randomItem = (): Item => ({
    x: Math.floor(Math.random() * ARENA_WIDTH),
    y: Math.floor(Math.random() * ARENA_HEIGHT),
})

const send = (ws: WSContext<WebSocket>, data: unknown) => {
    ws.send(JSON.stringify(data))
}

const broadcast = (room: Room, data: unknown) => {
    for (const player of room.players) {
        send(player.ws, data)
    }
}

const findRoomByPlayerId = (playerId: PlayerId): Room | undefined => {
    for (const room of rooms.values()) {
        if (room.players.some((player) => player.id === playerId)) {
            return room
        }
    }

    return undefined
}

const createPlayer = (
    nickname: string,
    ws: WSContext<WebSocket>,
): Player => ({
    id: randomId(),
    nickname,
    x: Math.floor(Math.random() * ARENA_WIDTH),
    y: Math.floor(Math.random() * ARENA_HEIGHT),
    score: 0,
    input: {
        up: false,
        down: false,
        left: false,
        right: false,
    },
    ws,
})

const startRoom = (player1: Player, player2: Player): Room => {
    const room: Room = {
        id: randomId(),
        players: [player1, player2],
        item: randomItem(),
        startedAt: Date.now(),
        durationMs: MATCH_DURATION_MS,
    }

    rooms.set(room.id, room)

    broadcast(room, {
        type: 'start',
        roomId: room.id,
        players: room.players.map((player) => ({
            id: player.id,
            nickname: player.nickname,
        })),
        durationMs: MATCH_DURATION_MS,
    })

    room.intervalId = setInterval(() => {
        updateRoom(room)
    }, 50)

    return room
}

const updateRoom = (room: Room) => {
    const now = Date.now()
    const elapsed = now - room.startedAt
    const timeLeftMs = Math.max(0, room.durationMs - elapsed)

    for (const player of room.players) {
        if (player.input.up) player.y -= PLAYER_SPEED
        if (player.input.down) player.y += PLAYER_SPEED
        if (player.input.left) player.x -= PLAYER_SPEED
        if (player.input.right) player.x += PLAYER_SPEED

        player.x = Math.max(0, Math.min(ARENA_WIDTH, player.x))
        player.y = Math.max(0, Math.min(ARENA_HEIGHT, player.y))

        const dx = player.x - room.item.x
        const dy = player.y - room.item.y
        const distance = Math.sqrt(dx * dx + dy * dy)

        if (distance <= PICKUP_DISTANCE) {
            player.score += 1
            room.item = randomItem()
        }
    }

    broadcast(room, {
        type: 'state',
        timeLeftMs,
        item: room.item,
        players: room.players.map((player) => ({
            id: player.id,
            nickname: player.nickname,
            x: player.x,
            y: player.y,
            score: player.score,
        })),
    })

    if (timeLeftMs <= 0) {
        finishRoom(room)
    }
}

const finishRoom = (room: Room) => {
    if (room.intervalId) {
        clearInterval(room.intervalId)
    }

    const [player1, player2] = room.players

    let winnerId: string | null = null

    if (player1.score > player2.score) {
        winnerId = player1.id
    }

    if (player2.score > player1.score) {
        winnerId = player2.id
    }

    broadcast(room, {
        type: 'gameOver',
        winnerId,
        scores: room.players.map((player) => ({
            playerId: player.id,
            nickname: player.nickname,
            score: player.score,
        })),
    })

    rooms.delete(room.id)
}

const removePlayer = (ws: WSContext<WebSocket>) => {
    if (waitingPlayer?.ws === ws) {
        waitingPlayer = null
        console.log('Waiting player disconnected')
        return
    }

    for (const room of rooms.values()) {
        const disconnectedPlayer = room.players.find((player) => player.ws === ws)

        if (disconnectedPlayer) {
            if (room.intervalId) {
                clearInterval(room.intervalId)
            }

            broadcast(room, {
                type: 'error',
                message: `${disconnectedPlayer.nickname} disconnected. Match cancelled.`,
            })

            rooms.delete(room.id)
            console.log('Room cancelled because player disconnected')
            return
        }
    }
}

const { injectWebSocket, upgradeWebSocket } = createNodeWebSocket({ app })

app.get('/', (c) => {
    return c.text('Node.js multiplayer game server is running')
})
app.use('/public/*', serveStatic({ root: './' }))

app.get('/debug', (c) => {
    return c.redirect('/public/debug.html')
})

app.get(
    '/ws',
    upgradeWebSocket(() => {
        let currentPlayerId: PlayerId | null = null

        return {
            onOpen: (_event, ws) => {
                send(ws, {
                    type: 'connected',
                    message: 'WebSocket connected. Send join message.',
                })
            },

            onMessage: (event, ws) => {
                let message: ClientMessage

                try {
                    message = JSON.parse(String(event.data))
                } catch {
                    send(ws, {
                        type: 'error',
                        message: 'Invalid JSON',
                    })
                    return
                }

                if (message.type === 'join') {
                    const player = createPlayer(message.nickname, ws)
                    currentPlayerId = player.id

                    console.log(`${player.nickname} joined`)

                    if (!waitingPlayer) {
                        waitingPlayer = player

                        send(ws, {
                            type: 'waiting',
                            playerId: player.id,
                            message: 'Waiting for another player',
                        })

                        return
                    }

                    const opponent = waitingPlayer
                    waitingPlayer = null

                    const room = startRoom(opponent, player)

                    console.log(`Room ${room.id} started`)
                    return
                }

                if (message.type === 'input') {
                    if (!currentPlayerId) {
                        send(ws, {
                            type: 'error',
                            message: 'Join first',
                        })
                        return
                    }

                    const room = findRoomByPlayerId(currentPlayerId)

                    if (!room) {
                        return
                    }

                    const player = room.players.find((p) => p.id === currentPlayerId)

                    if (!player) {
                        return
                    }

                    player.input = message.input
                }
            },

            onClose: (_event, ws) => {
                removePlayer(ws)
            },
        }
    }),
)

const server = serve(
    {
        fetch: app.fetch,
        port: 3000,
    },
    (info) => {
        console.log(`Server running on http://localhost:${info.port}`)
    },
)

injectWebSocket(server)