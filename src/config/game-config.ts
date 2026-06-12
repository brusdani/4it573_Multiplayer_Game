import { readFile } from 'node:fs/promises'

export type Position = {
    x: number
    y: number
}

export type GameConfig = {
    arenaWidth: number
    arenaHeight: number
    playerSpeed: number
    pickupDistance: number
    matchDurationMs: number
    playerSpawnPoints: Position[]
    itemSpawnPoints: Position[]
}

const CONFIG_PATH = new URL('../../data/default-map.json', import.meta.url)

const isPositiveNumber = (value: unknown): value is number => {
    return typeof value === 'number' && Number.isFinite(value) && value > 0
}

const isPosition = (value: unknown): value is Position => {
    if (typeof value !== 'object' || value === null) {
        return false
    }

    const position = value as Record<string, unknown>

    return (
        typeof position.x === 'number' &&
        Number.isFinite(position.x) &&
        typeof position.y === 'number' &&
        Number.isFinite(position.y)
    )
}

const validateGameConfig = (value: unknown): GameConfig => {
    if (typeof value !== 'object' || value === null) {
        throw new Error('Game configuration must be an object.')
    }

    const config = value as Record<string, unknown>

    if (!isPositiveNumber(config.arenaWidth)) {
        throw new Error('arenaWidth must be a positive number.')
    }

    if (!isPositiveNumber(config.arenaHeight)) {
        throw new Error('arenaHeight must be a positive number.')
    }

    if (!isPositiveNumber(config.playerSpeed)) {
        throw new Error('playerSpeed must be a positive number.')
    }

    if (!isPositiveNumber(config.pickupDistance)) {
        throw new Error('pickupDistance must be a positive number.')
    }

    if (!isPositiveNumber(config.matchDurationMs)) {
        throw new Error('matchDurationMs must be a positive number.')
    }

    if (
        !Array.isArray(config.playerSpawnPoints) ||
        config.playerSpawnPoints.length < 2 ||
        !config.playerSpawnPoints.every(isPosition)
    ) {
        throw new Error(
            'playerSpawnPoints must contain at least two valid positions.',
        )
    }

    if (
        !Array.isArray(config.itemSpawnPoints) ||
        config.itemSpawnPoints.length === 0 ||
        !config.itemSpawnPoints.every(isPosition)
    ) {
        throw new Error(
            'itemSpawnPoints must contain at least one valid position.',
        )
    }

    return {
        arenaWidth: config.arenaWidth,
        arenaHeight: config.arenaHeight,
        playerSpeed: config.playerSpeed,
        pickupDistance: config.pickupDistance,
        matchDurationMs: config.matchDurationMs,
        playerSpawnPoints: config.playerSpawnPoints,
        itemSpawnPoints: config.itemSpawnPoints,
    }
}

export const loadGameConfig = async (): Promise<GameConfig> => {
    try {
        const fileContent = await readFile(CONFIG_PATH, 'utf8')
        const parsedConfig: unknown = JSON.parse(fileContent)

        return validateGameConfig(parsedConfig)
    } catch (error) {
        const message =
            error instanceof Error ? error.message : 'Unknown configuration error'

        throw new Error(`Failed to load game configuration: ${message}`)
    }
}