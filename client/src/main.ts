import Phaser from 'phaser'
import './style.css'
import { GameScene } from './scenes/GameScene'

const startScreen =
    document.querySelector<HTMLElement>('#start-screen')

const nicknameForm =
    document.querySelector<HTMLFormElement>('#nickname-form')

const nicknameInput =
    document.querySelector<HTMLInputElement>('#nickname')

if (!startScreen || !nicknameForm || !nicknameInput) {
    throw new Error('Start screen elements were not found')
}

nicknameForm.addEventListener('submit', (event) => {
    event.preventDefault()

    const nickname = nicknameInput.value.trim()

    if (!nickname) {
        return
    }

    startScreen.style.display = 'none'

    const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.AUTO,
        width: 800,
        height: 600,
        backgroundColor: '#222222',
        parent: 'game-container',
        scene: [new GameScene(nickname)],
    }

    new Phaser.Game(config)
})
