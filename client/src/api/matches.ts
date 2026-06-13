export type Match = {
    id: number
    player1Nickname: string
    player2Nickname: string
    player1Score: number
    player2Score: number
    winnerNickname: string | null
    playedAt: string
}

export const fetchMatches = async (): Promise<Match[]> => {
    const response = await fetch('http://localhost:3000/matches')

    if (!response.ok) {
        throw new Error('Failed to load match history.')
    }

    const matches = await response.json() as Match[]

    return matches
}