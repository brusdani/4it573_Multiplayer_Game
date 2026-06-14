const API_URL = 'http://localhost:3000'

export type AuthUser = {
    id: number
    username: string
}

export type AuthResponse = {
    token: string
    user: AuthUser
}

type ErrorResponse = {
    error?: string
}

const parseError = async (
    response: Response,
): Promise<string> => {
    try {
        const data = await response.json() as ErrorResponse

        return data.error ?? 'Authentication request failed.'
    } catch {
        return 'Authentication request failed.'
    }
}

export const register = async (
    username: string,
    password: string,
): Promise<AuthResponse> => {
    const response = await fetch(
        `${API_URL}/auth/register`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username,
                password,
            }),
        },
    )

    if (!response.ok) {
        throw new Error(await parseError(response))
    }

    return response.json() as Promise<AuthResponse>
}

export const login = async (
    username: string,
    password: string,
): Promise<AuthResponse> => {
    const response = await fetch(
        `${API_URL}/auth/login`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username,
                password,
            }),
        },
    )

    if (!response.ok) {
        throw new Error(await parseError(response))
    }

    return response.json() as Promise<AuthResponse>
}

export const getCurrentUser = async (
    token: string,
): Promise<AuthUser> => {
    const response = await fetch(
        `${API_URL}/auth/me`,
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        },
    )

    if (!response.ok) {
        throw new Error(await parseError(response))
    }

    const data = await response.json() as {
        user: AuthUser
    }

    return data.user
}

export const logout = async (
    token: string,
): Promise<void> => {
    const response = await fetch(
        `${API_URL}/auth/logout`,
        {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
            },
        },
    )

    if (!response.ok) {
        throw new Error(await parseError(response))
    }
}