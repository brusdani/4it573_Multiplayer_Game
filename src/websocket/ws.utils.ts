import type { WSContext } from 'hono/ws'
import type { Room } from '../game/game.types.js'

export const send = (ws: WSContext<WebSocket>, data: unknown) => {
    ws.send(JSON.stringify(data))
}

export const broadcast = (room: Room, data: unknown) => {
    for (const player of room.players) {
        send(player.ws, data)
    }
}