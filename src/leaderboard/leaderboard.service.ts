import type { LeaderboardEntry } from './leaderboard.types.js'
import { getMatches } from '../database/match.repository.js'

type MutableLeaderboardEntry = Omit<
    LeaderboardEntry,
    'winRate'
>

type Match = Awaited<
    ReturnType<typeof getMatches>
>[number]

const createPlayerKey = (
    userId: number | null | undefined,
    nickname: string,
): string => {
    if (userId !== null && userId !== undefined) {
        return `user:${userId}`
    }

    return `nickname:${nickname}`
}

const getOrCreatePlayer = (
    players: Map<string, MutableLeaderboardEntry>,
    userId: number | null | undefined,
    nickname: string,
): MutableLeaderboardEntry => {
    const playerKey = createPlayerKey(
        userId,
        nickname,
    )

    const existingPlayer = players.get(playerKey)

    if (existingPlayer) {
        return existingPlayer
    }

    const newPlayer: MutableLeaderboardEntry = {
        userId: userId ?? null,
        nickname,
        gamesPlayed: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        totalScore: 0,
    }

    players.set(playerKey, newPlayer)

    return newPlayer
}

export const buildLeaderboard = (
    matches: Match[],
): LeaderboardEntry[] => {
    const players =
        new Map<string, MutableLeaderboardEntry>()

    for (const match of matches) {
        const player1 = getOrCreatePlayer(
            players,
            match.player1UserId,
            match.player1Nickname,
        )

        const player2 = getOrCreatePlayer(
            players,
            match.player2UserId,
            match.player2Nickname,
        )

        player1.gamesPlayed += 1
        player2.gamesPlayed += 1

        player1.totalScore += match.player1Score
        player2.totalScore += match.player2Score

        const isDraw =
            match.winnerUserId === null &&
            match.winnerNickname === null

        if (isDraw) {
            player1.draws += 1
            player2.draws += 1
            continue
        }

        const player1Won =
            match.winnerUserId !== null
                ? match.winnerUserId ===
                  match.player1UserId
                : match.winnerNickname ===
                  match.player1Nickname

        if (player1Won) {
            player1.wins += 1
            player2.losses += 1
            continue
        }

        player2.wins += 1
        player1.losses += 1
    }

    return [...players.values()]
        .map((player) => ({
            ...player,
            winRate:
                player.gamesPlayed === 0
                    ? 0
                    : player.wins /
                      player.gamesPlayed,
        }))
        .sort((playerA, playerB) => {
            if (playerB.wins !== playerA.wins) {
                return playerB.wins - playerA.wins
            }

            if (
                playerB.totalScore !==
                playerA.totalScore
            ) {
                return (
                    playerB.totalScore -
                    playerA.totalScore
                )
            }

            return playerA.nickname.localeCompare(
                playerB.nickname,
            )
        })
}

export const getLeaderboard = async (): Promise<
    LeaderboardEntry[]
> => {
    const matches = await getMatches()

    return buildLeaderboard(matches)
}
