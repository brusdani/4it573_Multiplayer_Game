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

    private readonly authToken: string
    private localPlayerId: string | null = null
    private matchActive = false

    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
    private queueKey!: Phaser.Input.Keyboard.Key
    private menuKey!: Phaser.Input.Keyboard.Key

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
    private canQueueAgain = false

    constructor(authToken: string) {
        super('GameScene')
        this.authToken = authToken
    }

    create(): void {

        if (!this.input.keyboard) {
            throw new Error('Keyboard input is unavailable')
        }

        this.cursors = this.input.keyboard.createCursorKeys()

        this.queueKey = this.input.keyboard.addKey(
            Phaser.Input.Keyboard.KeyCodes.Q,
        )
        this.menuKey = this.input.keyboard.addKey(
            Phaser.Input.Keyboard.KeyCodes.M,
        )

        this.wasd = this.input.keyboard.addKeys({
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D,
            jump: Phaser.Input.Keyboard.KeyCodes.W,
        }) as typeof this.wasd

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
        this.statusText.setDepth(10)
        this.timerText.setDepth(10)
        this.scoreText.setDepth(10)

        this.statusText.setStyle({
            backgroundColor: '#000000',
            padding: {
                x: 12,
                y: 8,
            },
            align: 'center',
        })


        this.itemObject = this.add.circle(0, 0, 10, 0xffd700)
        this.itemObject.setVisible(false)

        this.gameSocket = new GameSocket()

        this.gameSocket.onMessage((message) => {
            this.handleServerMessage(message)
        })

        this.gameSocket.connect(this.authToken)
    }

    private handleServerMessage(message: ServerMessage): void {
        if (message.type === 'connected') {
            this.statusText.setText(
                'Connected. Authenticating...',
            )
            return
        }
        if (message.type === 'authenticated') {
            this.statusText.setText(
                `Authenticated as ${message.username}`,
            )

            this.gameSocket.join()
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
            this.canQueueAgain = false
            this.clearPlayers()
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
            this.canQueueAgain = true
            this.lastInput = {
                left: false,
                right: false,
                jump: false
            }
            const winner = message.scores.find(
                (player) => player.playerId === message.winnerId,
            )

            const scoreLine = message.scores
                .map((player) => `${player.nickname}: ${player.score}`)
                .join(' | ')

            this.statusText
                .setVisible(true)
                .setText(
                    winner
                        ? `${winner.nickname} wins!\n${scoreLine}\nPress Q to queue again`
                        : `Draw!\n${scoreLine}\nPress Q to queue again`,
                )

            return
        }

        if (message.type === 'error') {
            this.statusText
                .setVisible(true)
                .setText(message.message)
        }
    }
    private clearPlayers(): void {
        for (const playerObject of this.playerObjects.values()) {
            playerObject.destroy()
        }

        this.playerObjects.clear()
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
        if (Phaser.Input.Keyboard.JustDown(this.menuKey)) {
            this.gameSocket.disconnect()

            window.dispatchEvent(
                new CustomEvent('return-to-menu'),
            )

            return
        }

        if (
            this.canQueueAgain &&
            Phaser.Input.Keyboard.JustDown(this.queueKey)
        ) {
            this.statusText
                .setVisible(true)
                .setText('Joining queue...')

            this.gameSocket.queue()
            return
        }
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