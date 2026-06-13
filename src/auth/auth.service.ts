import {
    randomBytes,
    scrypt as scryptCallback,
    timingSafeEqual,
} from 'node:crypto'
import { promisify } from 'node:util'
import {
    createUser,
    getUserByUsername,
} from '../database/user.repository.js'
import {
    createSession,
    deleteSessionByToken,
    getValidSessionByToken,
} from '../database/session.repository.js'
import { getUserById } from '../database/user.repository.js'

const scrypt = promisify(scryptCallback)

const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000

const hashPassword = async (
    password: string,
): Promise<string> => {
    const salt = randomBytes(16).toString('hex')

    const derivedKey = await scrypt(
        password,
        salt,
        64,
    ) as Buffer

    return `${salt}:${derivedKey.toString('hex')}`
}

const verifyPassword = async (
    password: string,
    storedPasswordHash: string,
): Promise<boolean> => {
    const [salt, storedHash] =
        storedPasswordHash.split(':')

    if (!salt || !storedHash) {
        return false
    }

    const derivedKey = await scrypt(
        password,
        salt,
        64,
    ) as Buffer

    const storedHashBuffer = Buffer.from(
        storedHash,
        'hex',
    )

    if (derivedKey.length !== storedHashBuffer.length) {
        return false
    }

    return timingSafeEqual(
        derivedKey,
        storedHashBuffer,
    )
}

const generateSessionToken = (): string => {
    return randomBytes(32).toString('hex')
}

export type AuthResult = {
    token: string
    user: {
        id: number
        username: string
    }
}

export const registerUser = async (
    username: string,
    password: string,
): Promise<AuthResult> => {
    const existingUser =
        await getUserByUsername(username)

    if (existingUser) {
        throw new Error('Username is already taken.')
    }

    const passwordHash = await hashPassword(password)

    const user = await createUser({
        username,
        passwordHash,
    })

    if (!user) {
        throw new Error('User could not be created.')
    }

    const token = generateSessionToken()

    await createSession({
        userId: user.id,
        token,
        expiresAt: new Date(
            Date.now() + SESSION_DURATION_MS,
        ),
    })

    return {
        token,
        user: {
            id: user.id,
            username: user.username,
        },
    }
}

export const loginUser = async (
    username: string,
    password: string,
): Promise<AuthResult> => {
    const user = await getUserByUsername(username)

    if (!user) {
        throw new Error('Invalid username or password.')
    }

    const passwordMatches = await verifyPassword(
        password,
        user.passwordHash,
    )

    if (!passwordMatches) {
        throw new Error('Invalid username or password.')
    }

    const token = generateSessionToken()

    await createSession({
        userId: user.id,
        token,
        expiresAt: new Date(
            Date.now() + SESSION_DURATION_MS,
        ),
    })

    return {
        token,
        user: {
            id: user.id,
            username: user.username,
        },
    }
}

export const getAuthenticatedUser = async (
    token: string,
) => {
    const session = await getValidSessionByToken(token)

    if (!session) {
        return null
    }

    const user = await getUserById(session.userId)

    if (!user) {
        return null
    }

    return {
        id: user.id,
        username: user.username,
    }
}

export const logoutUser = async (
    token: string,
): Promise<void> => {
    await deleteSessionByToken(token)
}