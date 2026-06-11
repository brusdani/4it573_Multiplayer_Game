import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { registerWebSocketRoute } from './websocket/ws.route.js'

const app = new Hono()

const { injectWebSocket } = registerWebSocketRoute(app)

app.get('/', (c) => {
    return c.text('Node.js multiplayer game server is running')
})

app.use('/public/*', serveStatic({ root: './' }))

app.get('/debug', (c) => {
    return c.redirect('/public/debug.html')
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