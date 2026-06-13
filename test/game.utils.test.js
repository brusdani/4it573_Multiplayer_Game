import test from 'ava'
import { randomItem } from '../dist/game/game.utils.js'

const config = {
    arenaWidth: 800,
    arenaHeight: 600,
    playerSpeed: 8,
    pickupDistance: 30,
    matchDurationMs: 60000,
    gravity: 2,
    jumpVelocity: -30,
    groundY: 560,
    playerSpawnPoints: [
        { x: 100, y: 560 },
        { x: 700, y: 560 },
    ],
    itemSpawnPoints: [
        { x: 100, y: 100 },
        { x: 200, y: 200 },
        { x: 300, y: 300 },
    ],
    platforms: [],
}

test('returns an item from configured spawn points', (t) => {
    const item = randomItem(config)

    const exists = config.itemSpawnPoints.some(
        (spawnPoint) =>
            spawnPoint.x === item.x &&
            spawnPoint.y === item.y,
    )

    t.true(exists)
})

test('does not return the previous item position', (t) => {
    const previousItem = {
        x: 100,
        y: 100,
    }

    for (let attempt = 0; attempt < 50; attempt += 1) {
        const item = randomItem(config, previousItem)

        t.false(
            item.x === previousItem.x &&
            item.y === previousItem.y,
        )
    }
})