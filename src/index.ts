import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { cors } from 'hono/cors'

import { loadGameConfig } from './config/game-config.js'
import { createRoomService } from './game/room.service.js'
import { registerWebSocketRoute } from './websocket/ws.route.js'
import {
    getMatches,
    getMatchesByUserId,
    saveMatch,
} from './database/match.repository.js'
import { getLeaderboard } from './leaderboard/leaderboard.service.js'
import { registerAuthRoutes } from './auth/auth.route.js'
import { getAuthenticatedUser } from './auth/auth.service.js'

const config = await loadGameConfig()

console.log('Game configuration loaded:', config)

const app = new Hono()

app.use(
    '*',
    cors({
        origin: 'http://localhost:5173',
        allowHeaders: [
            'Content-Type',
            'Authorization',
        ],
    }),
)

registerAuthRoutes(app)

const roomService = createRoomService(
    config,
    saveMatch,
)

const { injectWebSocket } = registerWebSocketRoute(
    app,
    config,
    roomService,
)

const getBearerToken = (
    authorizationHeader: string | undefined,
): string | null => {
    if (!authorizationHeader) {
        return null
    }

    const [scheme, token] =
        authorizationHeader.split(' ')

    if (scheme !== 'Bearer' || !token) {
        return null
    }

    return token
}

app.get('/', (c) => {
    return c.text(
        'Node.js multiplayer game server is running',
    )
})

app.use(
    '/public/*',
    serveStatic({
        root: './',
    }),
)

app.get('/debug', (c) => {
    return c.redirect('/public/debug.html')
})

app.get('/matches', async (c) => {
    const matches = await getMatches()

    return c.json(matches)
})

app.get('/matches/me', async (c) => {
    const token = getBearerToken(
        c.req.header('Authorization'),
    )

    if (!token) {
        return c.json(
            {
                error:
                    'Authentication token is required.',
            },
            401,
        )
    }

    const user = await getAuthenticatedUser(token)

    if (!user) {
        return c.json(
            {
                error:
                    'Authentication session is invalid or expired.',
            },
            401,
        )
    }

    const matches = await getMatchesByUserId(
        user.id,
    )

    return c.json(matches)
})

app.get('/leaderboard', async (c) => {
    return c.json(
        await getLeaderboard(),
    )
})

const server = serve(
    {
        fetch: app.fetch,
        port: 3000,
    },
    (info) => {
        console.log(
            `Server running on http://localhost:${info.port}`,
        )
    },
)

injectWebSocket(server)