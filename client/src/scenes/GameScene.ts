import Phaser from 'phaser'
import {
    GameSocket,
    type PlatformState,
    type PlayerState,
    type ServerMessage,
} from '../networking/game-socket'

const PLATFORM_COLOR = 0x35566f
const GROUND_COLOR = 0x29465c
const PLATFORM_BORDER_COLOR = 0x5f86a3

export class GameScene extends Phaser.Scene {
    private gameSocket!: GameSocket

    private statusText!: Phaser.GameObjects.Text
    private timerText!: Phaser.GameObjects.Text
    private scoreText!: Phaser.GameObjects.Text

    private playerObjects =
        new Map<string, Phaser.GameObjects.Sprite>()

    private previousScores =
        new Map<string, number>()

    private itemObject!: Phaser.GameObjects.Arc

    private platformObjects:
        Phaser.GameObjects.Rectangle[] = []

    private readonly authToken: string

    private localPlayerId: string | null = null
    private matchActive = false
    private canQueueAgain = false
    private suppressNextStateSounds = false

    private cursors!:
        Phaser.Types.Input.Keyboard.CursorKeys

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
        jump: false,
    }
    private localPlayerGrounded = false

    constructor(authToken: string) {
        super('GameScene')

        this.authToken = authToken
    }

    preload(): void {
        this.load.image(
            'background',
            '/assets/background.png',
        )

        this.load.spritesheet(
            'player',
            '/assets/player2.png',
            {
                frameWidth: 20,
                frameHeight: 20,
            },
        )
        this.load.audio(
            'coin-sound',
            '/assets/coin.mp3',
        )

        this.load.audio(
            'jump-sound',
            '/assets/jump.mp3',
        )
    }

    create(): void {
        this.add
            .image(400, 300, 'background')
            .setDisplaySize(800, 600)
            .setDepth(-10)

        if (!this.input.keyboard) {
            throw new Error(
                'Keyboard input is unavailable',
            )
        }

        this.createAnimations()
        this.createKeyboardControls()
        this.createHud()

        this.itemObject = this.add.circle(
            0,
            0,
            10,
            0xffd700,
        )

        this.itemObject.setVisible(false)

        this.gameSocket = new GameSocket()

        this.gameSocket.onMessage((message) => {
            this.handleServerMessage(message)
        })

        this.gameSocket.connect(this.authToken)


        document.addEventListener(
            'visibilitychange',
            () => {
                if (document.hidden) {
                    this.suppressNextStateSounds = true
                }
            },
        )

    }

    private createAnimations(): void {
        this.anims.create({
            key: 'player-walk-right',
            frames:
                this.anims.generateFrameNumbers(
                    'player',
                    {
                        start: 1,
                        end: 2,
                    },
                ),
            frameRate: 6,
            repeat: -1,
        })

        this.anims.create({
            key: 'player-walk-left',
            frames:
                this.anims.generateFrameNumbers(
                    'player',
                    {
                        start: 3,
                        end: 4,
                    },
                ),
            frameRate: 6,
            repeat: -1,
        })
    }

    private createKeyboardControls(): void {
        if (!this.input.keyboard) {
            throw new Error(
                'Keyboard input is unavailable',
            )
        }

        this.cursors =
            this.input.keyboard.createCursorKeys()

        this.queueKey =
            this.input.keyboard.addKey(
                Phaser.Input.Keyboard.KeyCodes.Q,
            )

        this.menuKey =
            this.input.keyboard.addKey(
                Phaser.Input.Keyboard.KeyCodes.M,
            )

        this.wasd =
            this.input.keyboard.addKeys({
                left:
                Phaser.Input.Keyboard.KeyCodes.A,
                right:
                Phaser.Input.Keyboard.KeyCodes.D,
                jump:
                Phaser.Input.Keyboard.KeyCodes.W,
            }) as typeof this.wasd
    }

    private createHud(): void {
        this.statusText = this.add
            .text(
                400,
                300,
                'Connecting to server...',
                {
                    fontSize: '28px',
                    color: '#ffffff',
                },
            )
            .setOrigin(0.5)
            .setDepth(10)

        this.statusText.setStyle({
            backgroundColor:
                'rgba(12, 28, 48, 0.78)',
            padding: {
                x: 14,
                y: 10,
            },
            align: 'center',
        })

        this.timerText = this.add
            .text(
                20,
                20,
                '',
                {
                    fontSize: '24px',
                    color: '#ffffff',
                },
            )
            .setDepth(10)

        this.timerText.setStyle({
            backgroundColor:
                'rgba(12, 28, 48, 0.68)',
            padding: {
                x: 8,
                y: 4,
            },
        })

        this.scoreText = this.add
            .text(
                20,
                60,
                '',
                {
                    fontSize: '20px',
                    color: '#ffffff',
                },
            )
            .setDepth(10)

        this.scoreText.setStyle({
            backgroundColor:
                'rgba(12, 28, 48, 0.68)',
            padding: {
                x: 8,
                y: 4,
            },
        })
    }

    private handleServerMessage(
        message: ServerMessage,
    ): void {
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
            this.localPlayerId =
                message.playerId

            return
        }

        if (message.type === 'waiting') {
            this.statusText.setText(
                'Waiting for another player...',
            )

            return
        }

        if (message.type === 'start') {
            this.matchActive = true
            this.canQueueAgain = false

            this.previousScores.clear()
            this.clearPlayers()

            this.statusText.setText(
                'Match started',
            )

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

            this.updatePlayers(
                message.players,
            )

            this.updateItem(
                message.item.x,
                message.item.y,
            )

            this.updateHud(
                message.players,
                message.timeLeftMs,
            )
            this.suppressNextStateSounds = false

            return
        }

        if (message.type === 'gameOver') {
            this.handleGameOver(message)

            return
        }

        if (message.type === 'error') {
            this.statusText
                .setVisible(true)
                .setText(message.message)
        }
    }

    private handleGameOver(
        message: Extract<
            ServerMessage,
            { type: 'gameOver' }
        >,
    ): void {
        this.matchActive = false
        this.canQueueAgain = true

        for (const playerObject of this.playerObjects.values()) {
            playerObject.stop()
            playerObject.setFrame(0)
        }

        this.lastInput = {
            left: false,
            right: false,
            jump: false,
        }

        const winner = message.scores.find(
            (player) =>
                player.playerId ===
                message.winnerId,
        )

        const scoreLine = message.scores
            .map(
                (player) =>
                    `${player.nickname}: ${player.score}`,
            )
            .join(' | ')

        const localPlayerWon =
            message.winnerId ===
            this.localPlayerId

        let resultMessage: string

        if (message.reason === 'forfeit') {
            resultMessage = localPlayerWon
                ? 'Opponent disconnected.\nYou win by forfeit!'
                : 'Match ended by forfeit.'
        } else if (!winner) {
            resultMessage = 'Draw!'
        } else if (localPlayerWon) {
            resultMessage = 'You win!'
        } else {
            resultMessage =
                `${winner.nickname} wins!`
        }

        this.statusText
            .setVisible(true)
            .setText(
                `${resultMessage}\n` +
                `${scoreLine}\n` +
                'Press Q to queue again\n' +
                'Press M to return to menu',
            )
    }

    private clearPlayers(): void {
        for (
            const playerObject
            of this.playerObjects.values()
            ) {
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
        for (
            const platformObject
            of this.platformObjects
            ) {
            platformObject.destroy()
        }

        this.platformObjects = []

        const groundHeight =
            arenaHeight - groundY

        const ground = this.add.rectangle(
            arenaWidth / 2,
            groundY + groundHeight / 2,
            arenaWidth,
            groundHeight,
            GROUND_COLOR,
        )

        ground.setStrokeStyle(
            2,
            PLATFORM_BORDER_COLOR,
        )

        this.platformObjects.push(ground)

        for (const platform of platforms) {
            const platformObject =
                this.add.rectangle(
                    platform.x,
                    platform.y,
                    platform.width,
                    platform.height,
                    PLATFORM_COLOR,
                )

            platformObject.setStrokeStyle(
                2,
                PLATFORM_BORDER_COLOR,
            )

            this.platformObjects.push(
                platformObject,
            )
        }
    }

    private updatePlayers(
        players: PlayerState[],
    ): void {
        for (const player of players) {
            let playerObject =
                this.playerObjects.get(
                    player.id,
                )

            const isLocalPlayer =
                player.id ===
                this.localPlayerId
            if (isLocalPlayer) {
                this.localPlayerGrounded =
                    player.isGrounded
            }

            if (!playerObject) {
                playerObject =
                    this.add.sprite(
                        player.x,
                        player.y,
                        'player',
                        0,
                    )

                playerObject.setScale(1.6)

                if (!isLocalPlayer) {
                    playerObject.setTint(
                        0xff4d4d,
                    )
                }

                this.playerObjects.set(
                    player.id,
                    playerObject,
                )
            }
            const previousScore =
                this.previousScores.get(player.id)

            if (
                previousScore !== undefined &&
                player.score > previousScore
            ) {
                this.playPlayerPickupTween(
                    playerObject,
                )

                if (
                    !document.hidden &&
                    !this.suppressNextStateSounds
                ) {
                    this.sound.play(
                        'coin-sound',
                        {
                            volume: 0.45,
                        },
                    )
                }

            }


            this.previousScores.set(
                player.id,
                player.score,
            )

            playerObject.setPosition(
                player.x,
                player.y,
            )

            if (!isLocalPlayer) {
                playerObject.stop()
                playerObject.setFrame(0)

                continue
            }

            if (this.lastInput.left) {
                playerObject.play(
                    'player-walk-left',
                    true,
                )
            } else if (
                this.lastInput.right
            ) {
                playerObject.play(
                    'player-walk-right',
                    true,
                )
            } else {
                playerObject.stop()
                playerObject.setFrame(0)
            }
        }
    }

    private updateItem(
        x: number,
        y: number,
    ): void {
        this.itemObject
            .setVisible(true)
            .setPosition(x, y)
    }

    private playPlayerPickupTween(
        playerObject: Phaser.GameObjects.Sprite,
    ): void {
        this.tweens.killTweensOf(playerObject)

        playerObject.setScale(2)

        this.tweens.add({
            targets: playerObject,
            scale: 1.6,
            duration: 180,
            ease: 'Back.easeOut',
        })
    }


    private updateHud(
        players: PlayerState[],
        timeLeftMs: number,
    ): void {
        const secondsLeft =
            Math.ceil(timeLeftMs / 1000)

        this.timerText.setText(
            `Time: ${secondsLeft}`,
        )

        const scoreLine = players
            .map(
                (player) =>
                    `${player.nickname}: ${player.score}`,
            )
            .join(' | ')

        this.scoreText.setText(scoreLine)
    }

    update(): void {
        if (
            Phaser.Input.Keyboard.JustDown(
                this.menuKey,
            )
        ) {
            this.gameSocket.disconnect()

            window.dispatchEvent(
                new CustomEvent(
                    'return-to-menu',
                ),
            )

            return
        }

        if (
            this.canQueueAgain &&
            Phaser.Input.Keyboard.JustDown(
                this.queueKey,
            )
        ) {
            this.statusText
                .setVisible(true)
                .setText(
                    'Joining queue...',
                )

            this.gameSocket.queue()

            return
        }

        if (!this.matchActive) {
            return
        }

        const input = {
            left:
                this.wasd.left.isDown ||
                Boolean(
                    this.cursors.left?.isDown,
                ),
            right:
                this.wasd.right.isDown ||
                Boolean(
                    this.cursors.right?.isDown,
                ),
            jump:
                this.wasd.jump.isDown ||
                Boolean(
                    this.cursors.up?.isDown,
                ),
        }
        const jumpStarted =
            input.jump &&
            !this.lastInput.jump &&
            this.localPlayerGrounded

        if (jumpStarted) {
            this.sound.play('jump-sound',
                {
                    volume: 0.45,
                },
            )
        }

        const hasChanged =
            input.left !==
            this.lastInput.left ||
            input.right !==
            this.lastInput.right ||
            input.jump !==
            this.lastInput.jump

        if (!hasChanged) {
            return
        }

        this.lastInput = input

        this.gameSocket.sendInput(input)
    }
}
