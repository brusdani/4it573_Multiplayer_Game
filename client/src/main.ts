import Phaser from 'phaser'
import './style.css'
import { GameScene } from './scenes/GameScene'

const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    backgroundColor: '#222222',
    parent: 'app',
    scene: [GameScene],
}

new Phaser.Game(config)