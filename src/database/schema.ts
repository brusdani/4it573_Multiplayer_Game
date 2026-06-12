import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const matchesTable = sqliteTable('matches', {
    id: integer('id').primaryKey({ autoIncrement: true }),

    player1Nickname: text('player1_nickname').notNull(),
    player2Nickname: text('player2_nickname').notNull(),

    player1Score: integer('player1_score').notNull(),
    player2Score: integer('player2_score').notNull(),

    winnerNickname: text('winner_nickname'),

    playedAt: integer('played_at', {
        mode: 'timestamp',
    })
        .notNull()
        .$defaultFn(() => new Date()),
})