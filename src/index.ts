import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { loadGameConfig } from './config/game-config.js'
import { createRoomService } from './game/room.service.js'
import { registerWebSocketRoute } from './websocket/ws.route.js'
import {
    getMatches,
    saveMatch,
} from './database/match.repository.js'
import { getLeaderboard } from './leaderboard/leaderboard.service.js'

const config = await loadGameConfig()

console.log('Game configuration loaded:', config)

const app = new Hono()
const roomService = createRoomService(config, saveMatch)

const { injectWebSocket } = registerWebSocketRoute(
    app,
    config,
    roomService,
)

app.get('/', (c) => {
    return c.text('Node.js multiplayer game server is running')
})

app.use('/public/*', serveStatic({ root: './' }))

app.get('/debug', (c) => {
    return c.redirect('/public/debug.html')
})
app.get('/matches', async (c) => {
    const matches = await getMatches()
    return c.json(matches)
})
app.get('/leaderboard', async (c) => {
    return c.json(await getLeaderboard())
})

const server = serve(
    {
        fetch: app.fetch,
        port: 3000,
    },
    (info) => {
        console.log(`Server running on http://localhost:${info.port}`)
    },
)

injectWebSocket(server)