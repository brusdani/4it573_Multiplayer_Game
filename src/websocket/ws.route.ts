import type { Hono } from 'hono'
import { createNodeWebSocket } from '@hono/node-ws'

import type { GameConfig } from '../config/game-config.js'
import type { PlayerId } from '../game/game.types.js'
import { createPlayer } from '../game/game.utils.js'
import type { RoomService } from '../game/room.service.js'
import { getAuthenticatedUser } from '../auth/auth.service.js'
import { send } from './ws.utils.js'
import { parseClientMessage } from './ws.validation.js'

type AuthenticatedUser = {
    id: number
    username: string
}

export const registerWebSocketRoute = (
    app: Hono,
    config: GameConfig,
    roomService: RoomService,
) => {
    const {
        injectWebSocket,
        upgradeWebSocket,
    } = createNodeWebSocket({
        app,
    })

    app.get(
        '/ws',
        upgradeWebSocket(() => {
            let currentPlayerId: PlayerId | null = null
            let authenticatedUser: AuthenticatedUser | null =
                null

            return {
                onOpen: (_event, ws) => {
                    send(ws, {
                        type: 'connected',
                        message:
                            'WebSocket connected. Authentication required.',
                    })
                },

                onMessage: async (event, ws) => {
                    const message = parseClientMessage(
                        event.data,
                    )

                    if (!message) {
                        send(ws, {
                            type: 'error',
                            message:
                                'Invalid WebSocket message',
                        })

                        return
                    }

                    if (message.type === 'authenticate') {
                        if (authenticatedUser) {
                            send(ws, {
                                type: 'error',
                                message:
                                    'WebSocket is already authenticated',
                            })

                            return
                        }

                        const user =
                            await getAuthenticatedUser(
                                message.token,
                            )

                        if (!user) {
                            send(ws, {
                                type: 'error',
                                message:
                                    'Authentication session is invalid or expired',
                            })

                            ws.close(
                                1008,
                                'Authentication failed',
                            )

                            return
                        }

                        authenticatedUser = user

                        send(ws, {
                            type: 'authenticated',
                            userId: user.id,
                            username: user.username,
                        })

                        console.log(
                            `${user.username} authenticated through WebSocket`,
                        )

                        return
                    }

                    if (!authenticatedUser) {
                        send(ws, {
                            type: 'error',
                            message:
                                'Authenticate before sending game messages',
                        })

                        return
                    }

                    if (message.type === 'join') {
                        if (currentPlayerId) {
                            send(ws, {
                                type: 'error',
                                message:
                                    'Player has already joined',
                            })

                            return
                        }

                        const player = createPlayer(
                            authenticatedUser.id,
                            authenticatedUser.username,
                            ws,
                            config.playerSpawnPoints[0],
                        )

                        currentPlayerId = player.id

                        send(ws, {
                            type: 'joined',
                            playerId: player.id,
                            nickname: player.nickname,
                        })

                        console.log(
                            `${player.nickname} joined`,
                        )

                        const matchmakingResult =
                            roomService.addPlayerToMatchmaking(
                                player,
                            )

                        if (
                            matchmakingResult.status ===
                            'waiting'
                        ) {
                            send(ws, {
                                type: 'waiting',
                                playerId: player.id,
                                message:
                                    'Waiting for another player',
                            })

                            return
                        }

                        console.log(
                            `Room ${matchmakingResult.room.id} started`,
                        )

                        return
                    }

                    if (message.type === 'queue') {
                        if (!currentPlayerId) {
                            send(ws, {
                                type: 'error',
                                message: 'Join first',
                            })

                            return
                        }

                        if (
                            roomService.findRoomByPlayerId(
                                currentPlayerId,
                            )
                        ) {
                            send(ws, {
                                type: 'error',
                                message:
                                    'Player is already in a match',
                            })

                            return
                        }

                        if (
                            roomService.isPlayerWaiting(
                                currentPlayerId,
                            )
                        ) {
                            send(ws, {
                                type: 'error',
                                message:
                                    'Player is already waiting',
                            })

                            return
                        }

                        const player = createPlayer(
                            authenticatedUser.id,
                            authenticatedUser.username,
                            ws,
                            config.playerSpawnPoints[0],
                        )

                        currentPlayerId = player.id

                        send(ws, {
                            type: 'joined',
                            playerId: player.id,
                            nickname: player.nickname,
                        })

                        const matchmakingResult =
                            roomService.addPlayerToMatchmaking(
                                player,
                            )

                        if (
                            matchmakingResult.status ===
                            'waiting'
                        ) {
                            send(ws, {
                                type: 'waiting',
                                playerId: player.id,
                                message:
                                    'Waiting for another player',
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
                            roomService.findRoomByPlayerId(
                                currentPlayerId,
                            )

                        if (!room) {
                            send(ws, {
                                type: 'error',
                                message:
                                    'Player is not currently in a match',
                            })

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