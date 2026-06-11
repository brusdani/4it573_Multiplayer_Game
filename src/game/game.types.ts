import type { WSContext } from 'hono/ws'

export type PlayerId = string
export type RoomId = string

export type InputState = {
    up: boolean
    down: boolean
    left: boolean
    right: boolean
}

export type Player = {
    id: PlayerId
    nickname: string
    x: number
    y: number
    score: number
    input: InputState
    ws: WSContext<WebSocket>
}

export type Item = {
    x: number
    y: number
}

export type Room = {
    id: RoomId
    players: Player[]
    item: Item
    startedAt: number
    durationMs: number
    intervalId?: NodeJS.Timeout
}