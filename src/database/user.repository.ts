import { eq } from 'drizzle-orm'
import { db } from './db.js'
import { usersTable } from './schema.js'

export type CreateUserInput = {
    username: string
    passwordHash: string
}

export const createUser = async (
    user: CreateUserInput,
) => {
    const result = await db
        .insert(usersTable)
        .values({
            username: user.username,
            passwordHash: user.passwordHash,
        })
        .returning()

    return result[0]
}

export const getUserByUsername = async (
    username: string,
) => {
    const result = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.username, username))
        .limit(1)

    return result[0] ?? null
}

export const getUserById = async (
    id: number,
) => {
    const result = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.id, id))
        .limit(1)

    return result[0] ?? null
}