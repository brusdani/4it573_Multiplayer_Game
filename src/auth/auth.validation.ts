export type AuthCredentials = {
    username: string
    password: string
}

type ValidationResult =
    | {
    success: true
    credentials: AuthCredentials
}
    | {
    success: false
    error: string
}

const USERNAME_MIN_LENGTH = 3
const USERNAME_MAX_LENGTH = 20
const PASSWORD_MIN_LENGTH = 8
const PASSWORD_MAX_LENGTH = 100

export const parseAuthCredentials = (
    value: unknown,
): ValidationResult => {
    if (
        typeof value !== 'object' ||
        value === null
    ) {
        return {
            success: false,
            error: 'Request body must be an object.',
        }
    }

    const body = value as Record<string, unknown>

    if (
        typeof body.username !== 'string' ||
        typeof body.password !== 'string'
    ) {
        return {
            success: false,
            error: 'Username and password are required.',
        }
    }

    const username = body.username.trim()
    const password = body.password

    if (
        username.length < USERNAME_MIN_LENGTH ||
        username.length > USERNAME_MAX_LENGTH
    ) {
        return {
            success: false,
            error:
                'Username must contain between 3 and 20 characters.',
        }
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        return {
            success: false,
            error:
                'Username may contain only letters, numbers and underscores.',
        }
    }

    if (
        password.length < PASSWORD_MIN_LENGTH ||
        password.length > PASSWORD_MAX_LENGTH
    ) {
        return {
            success: false,
            error:
                'Password must contain between 8 and 100 characters.',
        }
    }

    return {
        success: true,
        credentials: {
            username,
            password,
        },
    }
}