const canvas = document.getElementById('gameCanvas')
const ctx = canvas.getContext('2d')

const danielInfo = document.getElementById('danielInfo')
const opponentInfo = document.getElementById('opponentInfo')
const matchInfo = document.getElementById('matchInfo')

const startButton = document.getElementById('startButton')
const stopButton = document.getElementById('stopButton')

let socket1 = null
let socket2 = null
let latestState = null

const input1 = {
    up: false,
    down: false,
    left: false,
    right: false,
}

const input2 = {
    up: false,
    down: false,
    left: false,
    right: false,
}

const getWebSocketUrl = () => {
    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:'
    return `${protocol}//${location.host}/ws`
}

const sendInput = (socket, input) => {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
        return
    }

    socket.send(JSON.stringify({
        type: 'input',
        input,
    }))
}

const draw = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    ctx.fillStyle = '#222'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    if (!latestState) {
        ctx.fillStyle = '#eee'
        ctx.fillText('Click "Start debug match" to begin.', 20, 30)
        return
    }

    const item = latestState.item

    ctx.fillStyle = 'gold'
    ctx.beginPath()
    ctx.arc(item.x, item.y, 10, 0, Math.PI * 2)
    ctx.fill()

    for (const player of latestState.players) {
        const isDaniel = player.nickname === 'Daniel'

        ctx.fillStyle = isDaniel ? '#4da3ff' : '#ff4d4d'
        ctx.fillRect(player.x - 12, player.y - 12, 24, 24)

        ctx.fillStyle = '#eee'
        ctx.fillText(player.nickname, player.x - 20, player.y - 20)
    }
}

const updateInfo = (state) => {
    const daniel = state.players.find((player) => player.nickname === 'Daniel')
    const opponent = state.players.find((player) => player.nickname === 'Opponent')

    danielInfo.textContent = JSON.stringify(daniel, null, 2)
    opponentInfo.textContent = JSON.stringify(opponent, null, 2)

    matchInfo.textContent = JSON.stringify({
        timeLeftMs: state.timeLeftMs,
        item: state.item,
    }, null, 2)
}

const handleMessage = (label) => (event) => {
    const data = JSON.parse(event.data)

    if (data.type === 'state') {
        latestState = data
        updateInfo(data)
        draw()
        return
    }

    if (data.type === 'gameOver') {
        latestState = null
        draw()

        matchInfo.textContent = JSON.stringify({
            type: 'gameOver',
            winnerId: data.winnerId,
            scores: data.scores,
        }, null, 2)

        return
    }

    console.log(label, data)
}

const startDebugMatch = () => {
    latestState = null
    draw()

    socket1 = new WebSocket(getWebSocketUrl())
    socket2 = new WebSocket(getWebSocketUrl())

    socket1.onmessage = handleMessage('socket1')
    socket2.onmessage = handleMessage('socket2')

    socket1.onopen = () => {
        socket1.send(JSON.stringify({
            type: 'join',
            nickname: 'Daniel',
        }))
    }

    socket2.onopen = () => {
        socket2.send(JSON.stringify({
            type: 'join',
            nickname: 'Opponent',
        }))
    }
}

const stopMovement = () => {
    input1.up = false
    input1.down = false
    input1.left = false
    input1.right = false

    input2.up = false
    input2.down = false
    input2.left = false
    input2.right = false

    sendInput(socket1, input1)
    sendInput(socket2, input2)
}

window.addEventListener('keydown', (event) => {
    if (event.key === 'w') input1.up = true
    if (event.key === 's') input1.down = true
    if (event.key === 'a') input1.left = true
    if (event.key === 'd') input1.right = true

    if (event.key === 'ArrowUp') input2.up = true
    if (event.key === 'ArrowDown') input2.down = true
    if (event.key === 'ArrowLeft') input2.left = true
    if (event.key === 'ArrowRight') input2.right = true

    sendInput(socket1, input1)
    sendInput(socket2, input2)
})

window.addEventListener('keyup', (event) => {
    if (event.key === 'w') input1.up = false
    if (event.key === 's') input1.down = false
    if (event.key === 'a') input1.left = false
    if (event.key === 'd') input1.right = false

    if (event.key === 'ArrowUp') input2.up = false
    if (event.key === 'ArrowDown') input2.down = false
    if (event.key === 'ArrowLeft') input2.left = false
    if (event.key === 'ArrowRight') input2.right = false

    sendInput(socket1, input1)
    sendInput(socket2, input2)
})

startButton.addEventListener('click', startDebugMatch)
stopButton.addEventListener('click', stopMovement)

draw()