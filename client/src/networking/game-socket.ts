export type InputState = {
    left: boolean
    right: boolean
    jump: boolean
}

export type PlayerState = {
    id: string
    nickname: string
    x: number
    y: number
    score: number
    velocityY: number
    isGrounded: boolean
}

export type PlatformState = {
    x: number
    y: number
    width: number
    height: number
}

export type ServerMessage =
    | {
    type: 'connected'
    message: string
}
    | {
    type: 'authenticated'
    userId: number
    username: string
}
    | {
    type: 'joined'
    playerId: string
    nickname: string
}
    | {
    type: 'waiting'
    playerId: string
    message: string
}
    | {
    type: 'start'
    roomId: string
    players: Array<{
        id: string
        nickname: string
    }>
    durationMs: number
    arena: {
        width: number
        height: number
    }
    platforms: PlatformState[]
    groundY: number
}
    | {
    type: 'state'
    timeLeftMs: number
    item: {
        x: number
        y: number
    }
    players: PlayerState[]
}
    | {
    type: 'gameOver'
    winnerId: string | null
    reason: 'forfeit' | 'timeExpired'
    scores: Array<{
        playerId: string
        nickname: string
        score: number
    }>
}
    | {
    type: 'error'
    message: string
}

type MessageHandler = (
    message: ServerMessage,
) => void

export class GameSocket {
    private socket: WebSocket | null = null

    private readonly handlers: MessageHandler[] = []

    connect(token: string): void {
        this.socket = new WebSocket(
            'ws://localhost:3000/ws',
        )

        this.socket.addEventListener('open', () => {
            this.socket?.send(
                JSON.stringify({
                    type: 'authenticate',
                    token,
                }),
            )
        })

        this.socket.addEventListener(
            'message',
            (event) => {
                const message = JSON.parse(
                    String(event.data),
                ) as ServerMessage

                for (const handler of this.handlers) {
                    handler(message)
                }
            },
        )

        this.socket.addEventListener('close', () => {
            console.log('WebSocket disconnected')
        })

        this.socket.addEventListener(
            'error',
            (error) => {
                console.error(
                    'WebSocket error:',
                    error,
                )
            },
        )
    }

    onMessage(handler: MessageHandler): void {
        this.handlers.push(handler)
    }

    join(): void {
        if (
            !this.socket ||
            this.socket.readyState !== WebSocket.OPEN
        ) {
            return
        }

        this.socket.send(
            JSON.stringify({
                type: 'join',
            }),
        )
    }

    queue(): void {
        if (
            !this.socket ||
            this.socket.readyState !== WebSocket.OPEN
        ) {
            return
        }

        this.socket.send(
            JSON.stringify({
                type: 'queue',
            }),
        )
    }

    sendInput(input: InputState): void {
        if (
            !this.socket ||
            this.socket.readyState !== WebSocket.OPEN
        ) {
            return
        }

        this.socket.send(
            JSON.stringify({
                type: 'input',
                input,
            }),
        )
    }

    disconnect(): void {
        this.socket?.close()
        this.socket = null
    }
}