import type { WSContext } from 'hono/ws'
import type {
    GameConfig,
    Position,
} from '../config/game-config.js'
import type {
    InputState,
    Item,
    Player,
} from './game.types.js'

export const randomId = () => crypto.randomUUID()

export const defaultInputState = (): InputState => ({
    up: false,
    down: false,
    left: false,
    right: false,
})

const randomArrayItem = <T>(items: T[]): T => {
    const index = Math.floor(Math.random() * items.length)
    return items[index]
}

export const randomItem = (config: GameConfig): Item => {
    const spawnPoint = randomArrayItem(config.itemSpawnPoints)

    return {
        x: spawnPoint.x,
        y: spawnPoint.y,
    }
}

export const createPlayer = (
    nickname: string,
    ws: WSContext,
    spawnPoint: Position,
): Player => ({
    id: randomId(),
    nickname,
    x: spawnPoint.x,
    y: spawnPoint.y,
    score: 0,
    input: defaultInputState(),
    ws,
})