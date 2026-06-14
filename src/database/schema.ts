import {
    integer,
    sqliteTable,
    text,
} from 'drizzle-orm/sqlite-core'

export const usersTable = sqliteTable('users', {
    id: integer('id').primaryKey({
        autoIncrement: true,
    }),

    username: text('username')
        .notNull()
        .unique(),

    passwordHash: text('password_hash').notNull(),

    createdAt: integer('created_at', {
        mode: 'timestamp',
    })
        .notNull()
        .$defaultFn(() => new Date()),
})

export const sessionsTable = sqliteTable('sessions', {
    id: integer('id').primaryKey({
        autoIncrement: true,
    }),

    userId: integer('user_id')
        .notNull()
        .references(() => usersTable.id, {
            onDelete: 'cascade',
        }),

    token: text('token')
        .notNull()
        .unique(),

    expiresAt: integer('expires_at', {
        mode: 'timestamp',
    }).notNull(),

    createdAt: integer('created_at', {
        mode: 'timestamp',
    })
        .notNull()
        .$defaultFn(() => new Date()),
})

export const matchesTable = sqliteTable('matches', {
    id: integer('id').primaryKey({
        autoIncrement: true,
    }),

    player1UserId: integer('player1_user_id')
        .references(() => usersTable.id, {
            onDelete: 'set null',
        }),

    player2UserId: integer('player2_user_id')
        .references(() => usersTable.id, {
            onDelete: 'set null',
        }),

    winnerUserId: integer('winner_user_id')
        .references(() => usersTable.id, {
            onDelete: 'set null',
        }),

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