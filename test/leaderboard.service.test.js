import test from 'ava'
import {
    buildLeaderboard,
} from '../dist/leaderboard/leaderboard.service.js'

const matches = [
    {
        id: 1,
        player1Nickname: 'Daniel',
        player2Nickname: 'Opponent',
        player1Score: 3,
        player2Score: 1,
        winnerNickname: 'Daniel',
        playedAt: '2026-06-13T10:00:00.000Z',
    },
    {
        id: 2,
        player1Nickname: 'Opponent',
        player2Nickname: 'Daniel',
        player1Score: 2,
        player2Score: 2,
        winnerNickname: null,
        playedAt: '2026-06-13T11:00:00.000Z',
    },
    {
        id: 3,
        player1Nickname: 'Daniel',
        player2Nickname: 'Gaming',
        player1Score: 0,
        player2Score: 4,
        winnerNickname: 'Gaming',
        playedAt: '2026-06-13T12:00:00.000Z',
    },
]

test('calculates leaderboard statistics', (t) => {
    const leaderboard = buildLeaderboard(matches)

    const daniel = leaderboard.find(
        (entry) => entry.nickname === 'Daniel',
    )

    t.deepEqual(daniel, {
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