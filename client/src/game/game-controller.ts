import Phaser from 'phaser'
import { GameScene } from '../scenes/GameScene'

const gameContainer =
    document.querySelector<HTMLElement>(
        '#game-container',
    )

const mainHeader =
    document.querySelector<HTMLElement>(
        '.main-header',
    )

if (!gameContainer || !mainHeader) {
    throw new Error(
        'Required game elements were not found',
    )
}

let game: Phaser.Game | null = null

export const showGame = (
    authToken: string,
    pages: HTMLElement[],
): void => {
    if (game) {
        return
    }

    for (const page of pages) {
        page.hidden = true
    }

    mainHeader.hidden = true
    gameContainer.hidden = false

    const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.AUTO,
        width: 800,
        height: 600,
        backgroundColor: '#222222',
        parent: 'game-container',
        scene: [
            new GameScene(authToken),
        ],
    }

    game = new Phaser.Game(config)
}

export const hideGame = (): void => {
    game?.destroy(true)
    game = null

    gameContainer.replaceChildren()
    gameContainer.hidden = true
    mainHeader.hidden = false
}

export const ensureGameHidden = (): void => {
    gameContainer.hidden = true
    mainHeader.hidden = false
}
