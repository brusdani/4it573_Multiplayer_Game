import test from 'ava'
import {
    buildLeaderboard,
} from '../dist/leaderboard/leaderboard.service.js'

const matches = [
    {
        id: 1,
        player1UserId: null,
        player2UserId: null,
        winnerUserId: null,
        player1Nickname: 'Daniel',
        player2Nickname: 'Opponent',
        player1Score: 3,
        player2Score: 1,
        winnerNickname: 'Daniel',
        playedAt: new Date(
            '2026-06-13T10:00:00.000Z',
        ),
    },
    {
        id: 2,
        player1UserId: null,
        player2UserId: null,
        winnerUserId: null,
        player1Nickname: 'Opponent',
        player2Nickname: 'Daniel',
        player1Score: 2,
        player2Score: 2,
        winnerNickname: null,
        playedAt: new Date(
            '2026-06-13T11:00:00.000Z',
        ),
    },
    {
        id: 3,
        player1UserId: null,
        player2UserId: null,
        winnerUserId: null,
        player1Nickname: 'Daniel',
        player2Nickname: 'Gaming',
        player1Score: 0,
        player2Score: 4,
        winnerNickname: 'Gaming',
        playedAt: new Date(
            '2026-06-13T12:00:00.000Z',
        ),
    },
]

test('calculates leaderboard statistics', (t) => {
    const leaderboard = buildLeaderboard(matches)

    const daniel = leaderboard.find(
        (entry) => entry.nickname === 'Daniel',
    )

    t.deepEqual(daniel, {
        userId: null,
        nickname: 'Daniel',
        gamesPlayed: 3,
        wins: 1,
        losses: 1,
        draws: 1,
        totalScore: 5,
        winRate: 1 / 3,
    })
})

test('sorts players by wins and then total score', (t) => {
    const leaderboard = buildLeaderboard(matches)

    t.deepEqual(
        leaderboard.map((entry) => entry.nickname),
        [
            'Daniel',
            'Gaming',
            'Opponent',
        ],
    )
})

test('returns an empty leaderboard for no matches', (t) => {
    const leaderboard = buildLeaderboard([])

    t.deepEqual(leaderboard, [])
})

test('groups matches by user ID instead of nickname', (t) => {
    const accountMatches = [
        {
            id: 1,
            player1UserId: 10,
            player2UserId: 20,
            winnerUserId: 10,
            player1Nickname: 'Daniel',
            player2Nickname: 'Opponent',
            player1Score: 3,
            player2Score: 1,
            winnerNickname: 'Daniel',
            playedAt: new Date(
                '2026-06-13T10:00:00.000Z',
            ),
        },
        {
            id: 2,
            player1UserId: 10,
            player2UserId: 30,
            winnerUserId: 10,
            player1Nickname: 'DanielRenamed',
            player2Nickname: 'Gaming',
            player1Score: 5,
            player2Score: 2,
            winnerNickname: 'DanielRenamed',
            playedAt: new Date(
                '2026-06-13T11:00:00.000Z',
            ),
        },
    ]

    const leaderboard = buildLeaderboard(
        accountMatches,
    )

    const player = leaderboard.find(
        (entry) => entry.userId === 10,
    )

    t.deepEqual(player, {
        userId: 10,
        nickname: 'Daniel',
        gamesPlayed: 2,
        wins: 2,
        losses: 0,
        draws: 0,
        totalScore: 8,
        winRate: 1,
    })
})
