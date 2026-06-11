import {
    ARENA_HEIGHT,
    ARENA_WIDTH,
} from './game.constants.js'
import type { InputState, Item, Player } from './game.types.js'
import type { WSContext } from 'hono/ws'

export const randomId = () => crypto.randomUUID()

export const defaultInputState = (): InputState => ({
    up: false,
    down: false,
    left: false,
    right: false,
})

export const randomItem = (): Item => ({
    x: Math.floor(Math.random() * ARENA_WIDTH),
    y: Math.floor(Math.random() * ARENA_HEIGHT),
})

export const createPlayer = (
    nickname: string,
    ws: WSContext<WebSocket>,
): Player => ({
    id: randomId(),
    nickname,
    x: Math.floor(Math.random() * ARENA_WIDTH),
    y: Math.floor(Math.random() * ARENA_HEIGHT),
    score: 0,
    input: defaultInputState(),
    ws,
})