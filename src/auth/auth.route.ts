import type { Hono } from 'hono'
import {
    getAuthenticatedUser,
    loginUser,
    logoutUser,
    registerUser,
} from './auth.service.js'
import { parseAuthCredentials } from './auth.validation.js'

const getBearerToken = (
    authorizationHeader: string | undefined,
): string | null => {
    if (!authorizationHeader) {
        return null
    }

    const [scheme, token] = authorizationHeader.split(' ')

    if (scheme !== 'Bearer' || !token) {
        return null
    }

    return token
}

export const registerAuthRoutes = (
    app: Hono,
): void => {
    app.post('/auth/register', async (c) => {
        let body: unknown

        try {
            body = await c.req.json()
        } catch {
            return c.json(
                {
                    error: 'Request body must contain valid JSON.',
                },
                400,
            )
        }

        const validation = parseAuthCredentials(body)

        if (!validation.success) {
            return c.json(
                {
                    error: validation.error,
                },
                400,
            )
        }

        try {
            const result = await registerUser(
                validation.credentials.username,
                validation.credentials.password,
            )

            return c.json(result, 201)
        } catch (error) {
            const message =
                error instanceof Error
                    ? error.message
                    : 'Registration failed.'

            return c.json(
                {
                    error: message,
                },
                409,
            )
        }
    })

    app.post('/auth/login', async (c) => {
        let body: unknown

        try {
            body = await c.req.json()
        } catch {
            return c.json(
                {
                    error: 'Request body must contain valid JSON.',
                },
                400,
            )
        }

        const validation = parseAuthCredentials(body)

        if (!validation.success) {
            return c.json(
                {
                    error: validation.error,
                },
                400,
            )
        }

        try {
            const result = await loginUser(
                validation.credentials.username,
                validation.credentials.password,
            )

            return c.json(result)
        } catch {
            return c.json(
                {
                    error: 'Invalid username or password.',
                },
                401,
            )
        }
    })

    app.get('/auth/me', async (c) => {
        const token = getBearerToken(
            c.req.header('Authorization'),
        )

        if (!token) {
            return c.json(
                {
                    error: 'Authentication token is required.',
                },
                401,
            )
        }

        const user = await getAuthenticatedUser(token)

        if (!user) {
            return c.json(
                {
                    error: 'Authentication session is invalid or expired.',
                },
                401,
            )
        }

        return c.json({
            user,
        })
    })

    app.post('/auth/logout', async (c) => {
        const token = getBearerToken(
            c.req.header('Authorization'),
        )

        if (!token) {
            return c.json(
                {
                    error: 'Authentication token is required.',
                },
                401,
            )
        }

        await logoutUser(token)

        return c.json({
            message: 'Logged out successfully.',
        })
    })
}