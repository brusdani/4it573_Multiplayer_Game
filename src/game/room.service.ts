import type { WSContext } from 'hono/ws'
import type { GameConfig } from '../config/game-config.js'
import type { SaveMatchInput } from '../database/match.repository.js'
import type {
    Player,
    PlayerId,
    Room,
} from './game.types.js'
import {
    randomId,
    randomItem,
} from './game.utils.js'
import { broadcast } from '../websocket/ws.utils.js'

type SaveMatch = (match: SaveMatchInput) => Promise<void>

const PLAYER_HALF_HEIGHT = 16

export const createRoomService = (
    config: GameConfig,
    saveMatch: SaveMatch
) => {
    const rooms = new Map<string, Room>()
    let waitingPlayer: Player | null = null

    const findRoomByPlayerId = (
        playerId: PlayerId,
    ): Room | undefined => {
        for (const room of rooms.values()) {
            if (room.players.some((player) => player.id === playerId)) {
                return room
            }
        }

        return undefined
    }
    const isPlayerWaiting = (
        playerId: PlayerId,
    ): boolean => {
        return waitingPlayer?.id === playerId
    }

    const finishRoom = async (room: Room) => {
        if (room.intervalId) {
            clearInterval(room.intervalId)
        }

        const [player1, player2] = room.players

        let winnerId: string | null = null
        let winnerUserId: number | null = null
        let winnerNickname: string | null = null

        if (player1.score > player2.score) {
            winnerId = player1.id
            winnerUserId = player1.userId
            winnerNickname = player1.nickname
        }

        if (player2.score > player1.score) {
            winnerId = player2.id
            winnerUserId = player2.userId
            winnerNickname = player2.nickname
        }

        await saveMatch({
            player1UserId: player1.userId,
            player2UserId: player2.userId,
            winnerUserId,

            player1Nickname: player1.nickname,
            player2Nickname: player2.nickname,
            player1Score: player1.score,
            player2Score: player2.score,
            winnerNickname,
        })

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

    const updateRoom = (room: Room) => {
        const elapsed = Date.now() - room.startedAt
        const timeLeftMs = Math.max(0, room.durationMs - elapsed)

        for (const player of room.players) {

            if (player.input.left) {
                player.x -= config.playerSpeed
            }

            if (player.input.right) {
                player.x += config.playerSpeed
            }
            const jumpStarted =
                player.input.jump &&
                !player.wasJumpPressed &&
                player.isGrounded

            if (jumpStarted) {
                player.velocityY = config.jumpVelocity
                player.isGrounded = false
            }

            player.wasJumpPressed = player.input.jump
            const previousBottom =
                player.y + PLAYER_HALF_HEIGHT

            if (!player.isGrounded) {
                player.velocityY += config.gravity
                player.y += player.velocityY
            }
            const currentBottom =
                player.y + PLAYER_HALF_HEIGHT
            let landedOnPlatform = false
            if (player.velocityY >= 0) {
                for (const platform of config.platforms) {
                    const platformTop =
                        platform.y - platform.height / 2

                    const platformLeft =
                        platform.x - platform.width / 2

                    const platformRight =
                        platform.x + platform.width / 2

                    const isHorizontallyAbove =
                        player.x >= platformLeft &&
                        player.x <= platformRight

                    const crossedPlatformTop =
                        previousBottom <= platformTop &&
                        currentBottom >= platformTop

                    if (isHorizontallyAbove && crossedPlatformTop) {
                        player.y = platformTop - PLAYER_HALF_HEIGHT
                        player.velocityY = 0
                        player.isGrounded = true
                        landedOnPlatform = true
                        break
                    }
                }
            }

            if (
                player.isGrounded &&
                player.y < config.groundY &&
                !landedOnPlatform
            ) {
                player.isGrounded = false
            }

            if (player.y >= config.groundY) {
                player.y = config.groundY
                player.velocityY = 0
                player.isGrounded = true
            }


            player.x = Math.max(
                0,
                Math.min(config.arenaWidth, player.x),
            )

            player.y = Math.max(0, player.y)

            const dx = player.x - room.item.x
            const dy = player.y - room.item.y
            const distance = Math.sqrt(dx * dx + dy * dy)

            if (distance <= config.pickupDistance) {
                player.score += 1
                room.item = randomItem(config, room.item)
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
                velocityY: player.velocityY,
                isGrounded: player.isGrounded,
            })),
        })

        if (timeLeftMs <= 0 && !room.isFinishing) {
            room.isFinishing = true

            void finishRoom(room).catch((error) => {
                console.error('Failed to finish room:', error)

                rooms.delete(room.id)
            })
        }
    }

    const startRoom = (
        player1: Player,
        player2: Player,
    ): Room => {
        const player1Spawn = config.playerSpawnPoints[0]
        const player2Spawn = config.playerSpawnPoints[1]

        player1.x = player1Spawn.x
        player1.y = player1Spawn.y

        player2.x = player2Spawn.x
        player2.y = player2Spawn.y

        const room: Room = {
            id: randomId(),
            players: [player1, player2],
            item: randomItem(config),
            startedAt: Date.now(),
            durationMs: config.matchDurationMs,
            isFinishing: false,
        }

        rooms.set(room.id, room)

        broadcast(room, {
            type: 'start',
            roomId: room.id,
            players: room.players.map((player) => ({
                id: player.id,
                nickname: player.nickname,
            })),
            durationMs: config.matchDurationMs,
            arena: {
                width: config.arenaWidth,
                height: config.arenaHeight,
            },
            platforms: config.platforms,
            groundY: config.groundY,
        })

        room.intervalId = setInterval(() => {
            updateRoom(room)
        }, 50)

        return room
    }

    const addPlayerToMatchmaking = (player: Player) => {
        if (!waitingPlayer) {
            waitingPlayer = player

            return {
                status: 'waiting' as const,
                playerId: player.id,
            }
        }

        const opponent = waitingPlayer
        waitingPlayer = null

        const room = startRoom(opponent, player)

        return {
            status: 'started' as const,
            room,
        }
    }

    const updatePlayerInput = (
        playerId: PlayerId,
        room: Room,
        input: Player['input'],
    ) => {
        const player = room.players.find(
            (candidate) => candidate.id === playerId,
        )

        if (!player) {
            return
        }

        player.input = input
    }

    const removePlayer = (ws: WSContext) => {
        if (waitingPlayer?.ws === ws) {
            waitingPlayer = null
            console.log('Waiting player disconnected')
            return
        }

        for (const room of rooms.values()) {
            const disconnectedPlayer = room.players.find(
                (player) => player.ws === ws,
            )

            if (!disconnectedPlayer) {
                continue
            }

            if (room.intervalId) {
                clearInterval(room.intervalId)
            }

            broadcast(room, {
                type: 'error',
                message:
                    `${disconnectedPlayer.nickname} disconnected. Match cancelled.`,
            })

            rooms.delete(room.id)
            console.log('Room cancelled because player disconnected')
            return
        }
    }

    return {
        addPlayerToMatchmaking,
        findRoomByPlayerId,
        isPlayerWaiting,
        removePlayer,
        updatePlayerInput,
    }
}

export type RoomService = ReturnType<typeof createRoomService>