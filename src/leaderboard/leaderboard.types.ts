export type LeaderboardEntry = {
    userId: number | null
    nickname: string
    gamesPlayed: number
    wins: number
    losses: number
    draws: number
    totalScore: number
    winRate: number
}