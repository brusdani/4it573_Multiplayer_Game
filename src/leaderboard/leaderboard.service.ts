import type { LeaderboardEntry } from './leaderboard.types.js'
import { getMatches } from '../database/match.repository.js'

type MutableLeaderboardEntry = Omit<LeaderboardEntry, 'winRate'>

const getOrCreatePlayer = (
    players: Map<string, MutableLeaderboardEntry>,
    nickname: string,
): MutableLeaderboardEntry => {
    const existingPlayer = players.get(nickname)

    if (existingPlayer) {
        return existingPlayer
    }

    const newPlayer: MutableLeaderboardEntry = {
        nickname,
        gamesPlayed: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        totalScore: 0,
    }

    players.set(nickname, newPlayer)

    return newPlayer
}

export const getLeaderboard = async (): Promise<LeaderboardEntry[]> => {
    const matches = await getMatches()
    const players = new Map<string, MutableLeaderboardEntry>()

    for (const match of matches) {
        const player1 = getOrCreatePlayer(players, match.player1Nickname)
        const player2 = getOrCreatePlayer(players, match.player2Nickname)

        player1.gamesPlayed += 1
        player2.gamesPlayed += 1

        player1.totalScore += match.player1Score
        player2.totalScore += match.player2Score

        if (match.winnerNickname === null) {
            player1.draws += 1
            player2.draws += 1
            continue
        }

        if (match.winnerNickname === match.player1Nickname) {
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
                    : player.wins / player.gamesPlayed,
        }))
        .sort((playerA, playerB) => {
            if (playerB.wins !== playerA.wins) {
                return playerB.wins - playerA.wins
            }

            if (playerB.totalScore !== playerA.totalScore) {
                return playerB.totalScore - playerA.totalScore
            }

            return playerA.nickname.localeCompare(playerB.nickname)
        })
}