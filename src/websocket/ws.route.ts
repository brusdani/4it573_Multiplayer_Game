import type { Hono } from 'hono'
import { createNodeWebSocket } from '@hono/node-ws'

import type { GameConfig } from '../config/game-config.js'
import type { PlayerId } from '../game/game.types.js'
import { createPlayer } from '../game/game.utils.js'
import type { RoomService } from '../game/room.service.js'
import type { ClientMessage } from './ws.types.js'
import { send } from './ws.utils.js'

export const registerWebSocketRoute = (
    app: Hono,
    config: GameConfig,
    roomService: RoomService,
) => {
    const { injectWebSocket, upgradeWebSocket } = createNodeWebSocket({
        app,
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
                        const player = createPlayer(
                            message.nickname,
                            ws,
                            config.playerSpawnPoints[0],
                        )

                        currentPlayerId = player.id

                        console.log(`${player.nickname} joined`)

                        const matchmakingResult =
                            roomService.addPlayerToMatchmaking(player)

                        if (matchmakingResult.status === 'waiting') {
                            send(ws, {
                                type: 'waiting',
                                playerId: player.id,
                                message: 'Waiting for another player',
                            })

                            return
                        }

                        console.log(
                            `Room ${matchmakingResult.room.id} started`,
                        )

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

                        const room =
                            roomService.findRoomByPlayerId(currentPlayerId)

                        if (!room) {
                            return
                        }

                        roomService.updatePlayerInput(
                            currentPlayerId,
                            room,
                            message.input,
                        )
                    }
                },

                onClose: (_event, ws) => {
                    roomService.removePlayer(ws)
                },
            }
        }),
    )

    return {
        injectWebSocket,
    }
}