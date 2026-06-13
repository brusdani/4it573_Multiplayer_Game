import type { WSContext } from 'hono/ws'
import type { Position } from '../config/game-config.js'

export type PlayerId = string
export type RoomId = string

export type InputState = {
    left: boolean
    right: boolean
    jump: boolean
}

export type Player = {
    id: PlayerId
    nickname: string
    x: number
    y: number
    score: number
    input: InputState
    velocityY: number
    isGrounded: boolean
    wasJumpPressed: boolean
    ws: WSContext
}

export type Item = Position

export type Room = {
    id: RoomId
    players: Player[]
    item: Item
    startedAt: number
    durationMs: number
    isFinishing: boolean
    intervalId?: NodeJS.Timeout
}