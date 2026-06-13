import type { InputState } from '../game/game.types.js'

export type ClientMessage =
    | { type: 'join'; nickname: string }
    | { type: 'input'; input: InputState }
    | { type: 'queue' }