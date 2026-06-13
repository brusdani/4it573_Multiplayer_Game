export type LeaderboardEntry = {
    nickname: string
    gamesPlayed: number
    wins: number
    losses: number
    draws: number
    totalScore: number
    winRate: number
}

export const fetchLeaderboard = async (): Promise<LeaderboardEntry[]> => {
    const response = await fetch('http://localhost:3000/leaderboard')

    if (!response.ok) {
        throw new Error('Failed to load leaderboard.')
    }

    return await response.json() as LeaderboardEntry[]
}