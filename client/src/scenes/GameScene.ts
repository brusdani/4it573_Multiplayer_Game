import Phaser from 'phaser'
import { GameSocket } from '../networking/game-socket'

export class GameScene extends Phaser.Scene {
    private gameSocket!: GameSocket
    private statusText!: Phaser.GameObjects.Text

    constructor() {
        super('GameScene')
    }

    create(): void {
        this.statusText = this.add
            .text(400, 300, 'Connecting to server...', {
                fontSize: '28px',
                color: '#ffffff',
            })
            .setOrigin(0.5)

        this.gameSocket = new GameSocket()

        this.gameSocket.onMessage((message) => {
            if (message.type === 'connected') {
                this.statusText.setText('Connected to server')
                this.gameSocket.join('Daniel')
                return
            }

            if (message.type === 'waiting') {
                this.statusText.setText('Waiting for another player...')
                return
            }

            if (message.type === 'start') {
                this.statusText.setText('Match started')
                return
            }

            if (message.type === 'error') {
                this.statusText.setText(message.message)
            }
        })

        this.gameSocket.connect()
    }
}