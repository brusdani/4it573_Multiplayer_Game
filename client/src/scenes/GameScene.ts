import Phaser from 'phaser'
import {
    GameSocket,
    type PlayerState,
    type ServerMessage,
} from '../networking/game-socket'

export class GameScene extends Phaser.Scene {
    private gameSocket!: GameSocket

    private statusText!: Phaser.GameObjects.Text
    private timerText!: Phaser.GameObjects.Text
    private scoreText!: Phaser.GameObjects.Text


    private playerObjects = new Map<string, Phaser.GameObjects.Rectangle>()
    private itemObject!: Phaser.GameObjects.Arc

    private nickname = 'Player'
    private localPlayerId: string | null = null
    private matchActive = false

    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys

    private wasd!: {
        up: Phaser.Input.Keyboard.Key
        down: Phaser.Input.Keyboard.Key
        left: Phaser.Input.Keyboard.Key
        right: Phaser.Input.Keyboard.Key
    }

    private lastInput = {
        up: false,
        down: false,
        left: false,
        right: false,
    }

    constructor() {
        super('GameScene')
    }

    create(): void {
        const params = new URLSearchParams(window.location.search)

        if (!this.input.keyboard) {
            throw new Error('Keyboard input is unavailable')
        }

        this.cursors = this.input.keyboard.createCursorKeys()

        this.wasd = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D,
        }) as typeof this.wasd

        this.nickname =
            params.get('nickname')?.trim() || 'Player'
        this.statusText = this.add
            .text(400, 300, 'Connecting to server...', {
                fontSize: '28px',
                color: '#ffffff',
            })
            .setOrigin(0.5)

        this.timerText = this.add.text(20, 20, '', {
            fontSize: '24px',
            color: '#ffffff',
        })

        this.scoreText = this.add.text(20, 55, '', {
            fontSize: '20px',
            color: '#ffffff',
        })

        this.itemObject = this.add.circle(0, 0, 10, 0xffd700)
        this.itemObject.setVisible(false)

        this.gameSocket = new GameSocket()

        this.gameSocket.onMessage((message) => {
            this.handleServerMessage(message)
        })

        this.gameSocket.connect()
    }

    private handleServerMessage(message: ServerMessage): void {
        if (message.type === 'connected') {
            this.statusText.setText('Connected to server')
            this.gameSocket.join(this.nickname)
            return
        }
        if (message.type === 'joined') {
            this.localPlayerId = message.playerId
            return
        }

        if (message.type === 'waiting') {
            this.statusText.setText('Waiting for another player...')
            return
        }

        if (message.type === 'start') {
            this.matchActive = true
            this.statusText.setText('Match started')
            return
        }

        if (message.type === 'state') {
            this.statusText.setVisible(false)

            this.updatePlayers(message.players)
            this.updateItem(message.item.x, message.item.y)
            this.updateHud(message.players, message.timeLeftMs)

            return
        }

        if (message.type === 'gameOver') {
            this.matchActive = false
            this.lastInput = {
                up: false,
                down: false,
                left: false,
                right: false,
            }
            this.statusText
                .setVisible(true)
                .setText(
                    message.winnerId
                        ? 'Game over'
                        : 'Game over — draw',
                )

            return
        }

        if (message.type === 'error') {
            this.statusText
                .setVisible(true)
                .setText(message.message)
        }
    }

    private updatePlayers(players: PlayerState[]): void {
        for (const player of players) {
            let playerObject = this.playerObjects.get(player.id)

            if (!playerObject) {
                playerObject = this.add.rectangle(
                    player.x,
                    player.y,
                    32,
                    32,
                    player.id === this.localPlayerId
                        ? 0x4da3ff
                        : 0xff4d4d
                )

                this.playerObjects.set(player.id, playerObject)
            }

            playerObject.setPosition(player.x, player.y)
        }
    }

    private updateItem(x: number, y: number): void {
        this.itemObject
            .setVisible(true)
            .setPosition(x, y)
    }

    private updateHud(
        players: PlayerState[],
        timeLeftMs: number,
    ): void {
        const secondsLeft = Math.ceil(timeLeftMs / 1000)

        this.timerText.setText(`Time: ${secondsLeft}`)

        const scoreLine = players
            .map((player) => `${player.nickname}: ${player.score}`)
            .join(' | ')

        this.scoreText.setText(scoreLine)
    }
    update(): void {
        if (!this.matchActive) {
            return
        }
        const input = {
            up: this.wasd.up.isDown || Boolean(this.cursors.up?.isDown),
            down: this.wasd.down.isDown || Boolean(this.cursors.down?.isDown),
            left: this.wasd.left.isDown || Boolean(this.cursors.left?.isDown),
            right: this.wasd.right.isDown || Boolean(this.cursors.right?.isDown),
        }

        const hasChanged =
            input.up !== this.lastInput.up ||
            input.down !== this.lastInput.down ||
            input.left !== this.lastInput.left ||
            input.right !== this.lastInput.right

        if (!hasChanged) {
            return
        }

        this.lastInput = input
        this.gameSocket.sendInput(input)
    }
}