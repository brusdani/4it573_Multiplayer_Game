import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import { createNodeWebSocket } from '@hono/node-ws'
import type { WSContext } from 'hono/ws'

const app = new Hono()

type PlayerId = string
type RoomId = string

type Player = {
    id: PlayerId
    nickname: string
    ws: WSContext<WebSocket>
}

type Room = {
    id: RoomId
    players: Player[]
}

type ClientMessage = {
    type: 'join'
    nickname: string
}

const rooms = new Map<RoomId, Room>()
let waitingPlayer: Player | null = null

const randomId = () => crypto.randomUUID()

const send = (ws: WSContext<WebSocket>, data: unknown) => {
    ws.send(JSON.stringify(data))
}

const broadcast = (room: Room, data: unknown) => {
    for (const player of room.players) {
        send(player.ws, data)
    }
}

const createPlayer = (
    nickname: string,
    ws: WSContext<WebSocket>,
): Player => {
    return {
        id: randomId(),
        nickname,
        ws,
    }
}

const startRoom = (player1: Player, player2: Player): Room => {
    const room: Room = {
        id: randomId(),
        players: [player1, player2],
    }

    rooms.set(room.id, room)

    broadcast(room, {
        type: 'start',
        roomId: room.id,
        players: room.players.map((player) => ({
            id: player.id,
            nickname: player.nickname,
        })),
    })

    return room
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

app.get(
    '/ws',
    upgradeWebSocket(() => {
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