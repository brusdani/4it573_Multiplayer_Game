import { desc } from 'drizzle-orm'
import { db } from './db.js'
import { matchesTable } from './schema.js'

export type SaveMatchInput = {
    player1Nickname: string
    player2Nickname: string
    player1Score: number
    player2Score: number
    winnerNickname: string | null
}

export const saveMatch = async (
    match: SaveMatchInput,
): Promise<void> => {
    await db.insert(matchesTable).values({
        player1Nickname: match.player1Nickname,
        player2Nickname: match.player2Nickname,
        player1Score: match.player1Score,
        player2Score: match.player2Score,
        winnerNickname: match.winnerNickname,
    })
}

export const getMatches = async () => {
    return db
        .select()
        .from(matchesTable)
        .orderBy(desc(matchesTable.playedAt))
}