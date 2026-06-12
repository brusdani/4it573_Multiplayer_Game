import Phaser from 'phaser'

export class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene')
    }

    create(): void {
        this.add
            .text(400, 300, 'Phaser client is running', {
                fontSize: '32px',
                color: '#ffffff',
            })
            .setOrigin(0.5)
    }
}