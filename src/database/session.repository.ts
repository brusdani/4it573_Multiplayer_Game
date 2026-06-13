import { and, eq, gt } from 'drizzle-orm'
import { db } from './db.js'
import { sessionsTable } from './schema.js'

export type CreateSessionInput = {
    userId: number
    token: string
    expiresAt: Date
}

export const createSession = async (
    session: CreateSessionInput,
) => {
    const result = await db
        .insert(sessionsTable)
        .values({
            userId: session.userId,
            token: session.token,
            expiresAt: session.expiresAt,
        })
        .returning()

    return result[0]
}

export const getValidSessionByToken = async (
    token: string,
) => {
    const result = await db
        .select()
        .from(sessionsTable)
        .where(
            and(
                eq(sessionsTable.token, token),
                gt(sessionsTable.expiresAt, new Date()),
            ),
        )
        .limit(1)

    return result[0] ?? null
}

export const deleteSessionByToken = async (
    token: string,
): Promise<void> => {
    await db
        .delete(sessionsTable)
        .where(eq(sessionsTable.token, token))
}