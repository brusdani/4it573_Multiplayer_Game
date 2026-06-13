import Phaser from 'phaser'
import {
    GameSocket, type PlatformState,
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
    private platformObjects: Phaser.GameObjects.Rectangle[] = []

    private nickname = 'Player'
    private localPlayerId: string | null = null
    private matchActive = false

    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys

    private wasd!: {
        left: Phaser.Input.Keyboard.Key
        right: Phaser.Input.Keyboard.Key
        jump: Phaser.Input.Keyboard.Key
    }

    private lastInput = {
        left: false,
        right: false,
        jump: false
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
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D,
            jump: Phaser.Input.Keyboard.KeyCodes.W,
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
            this.drawMap(
                message.platforms,
                message.groundY,
                message.arena.width,
                message.arena.height,
                )
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
                left: false,
                right: false,
                jump: false
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

    private drawMap(
        platforms: PlatformState[],
        groundY: number,
        arenaWidth: number,
        arenaHeight: number,
    ): void {
        for (const platformObject of this.platformObjects) {
            platformObject.destroy()
        }

        this.platformObjects = []

        const groundHeight = arenaHeight - groundY

        const ground = this.add.rectangle(
            arenaWidth / 2,
            groundY + groundHeight / 2,
            arenaWidth,
            groundHeight,
            0x555555,
        )

        this.platformObjects.push(ground)

        for (const platform of platforms) {
            const platformObject = this.add.rectangle(
                platform.x,
                platform.y,
                platform.width,
                platform.height,
                0x777777,
            )

            this.platformObjects.push(platformObject)
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
            left: this.wasd.left.isDown || Boolean(this.cursors.left?.isDown),
            right: this.wasd.right.isDown || Boolean(this.cursors.right?.isDown),
            jump: this.wasd.jump.isDown || Boolean(this.cursors.up?.isDown)
        }

        const hasChanged =
            input.left !== this.lastInput.left ||
            input.right !== this.lastInput.right ||
            input.jump !== this.lastInput.jump

        if (!hasChanged) {
            return
        }

        this.lastInput = input
        this.gameSocket.sendInput(input)
    }
}