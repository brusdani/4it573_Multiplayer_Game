export type Match = {
    id: number
    player1Nickname: string
    player2Nickname: string
    player1Score: number
    player2Score: number
    winnerNickname: string | null
    playedAt: string
}

type ErrorResponse = {
    error?: string
}

const parseError = async (
    response: Response,
): Promise<string> => {
    try {
        const data =
            await response.json() as ErrorResponse

        return (
            data.error ??
            'Failed to load match history.'
        )
    } catch {
        return 'Failed to load match history.'
    }
}

export const fetchMyMatches = async (
    token: string,
): Promise<Match[]> => {
    const response = await fetch(
        'http://localhost:3000/matches/me',
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        },
    )

    if (!response.ok) {
        throw new Error(
            await parseError(response),
        )
    }

    return await response.json() as Match[]
}