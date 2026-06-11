import { Hono } from 'hono'
import { serve } from '@hono/node-server'

const app = new Hono()

app.get('/', (c) => {
    return c.text('Node.js multiplayer game server is running')
})

serve(
    {
        fetch: app.fetch,
        port: 3000,
    },
    (info) => {
        console.log(`Server running on http://localhost:${info.port}`)
    },
)