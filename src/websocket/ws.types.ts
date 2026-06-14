import type { InputState } from '../game/game.types.js'

export type ClientMessage =
    | {
    type: 'authenticate'
    token: string
}
    | {
    type: 'join'
}
    | {
    type: 'input'
    input: InputState
}
    | {
    type: 'queue'
}