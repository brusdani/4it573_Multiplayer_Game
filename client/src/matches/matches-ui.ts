import {
    fetchMyMatches,
    type Match,
} from '../api/matches'
import type { AuthUser } from '../api/auth'

const MATCH_HISTORY_LIMIT = 20

const matchesStatus =
    document.querySelector<HTMLElement>(
        '#matches-status',
    )

const matchesList =
    document.querySelector<HTMLElement>(
        '#matches-list',
    )

if (!matchesStatus || !matchesList) {
    throw new Error(
        'Required match history elements were not found',
    )
}

const createMatchElement = (
    match: Match,
    authenticatedUser: AuthUser,
): HTMLElement => {
    const matchElement =
        document.createElement('article')

    matchElement.className = 'match-card'

    const isDraw =
        match.winnerNickname === null

    const isWin =
        match.winnerNickname ===
        authenticatedUser.username

    if (isDraw) {
        matchElement.classList.add('match-draw')
    } else if (isWin) {
        matchElement.classList.add('match-win')
    } else {
        matchElement.classList.add('match-loss')
    }

    const resultElement =
        document.createElement('strong')

    resultElement.textContent =
        `${match.player1Nickname} ${match.player1Score}` +
        ` : ${match.player2Score} ${match.player2Nickname}`

    const outcomeElement =
        document.createElement('span')

    if (isDraw) {
        outcomeElement.textContent = 'Draw'
    } else if (isWin) {
        outcomeElement.textContent = 'Victory'
    } else {
        outcomeElement.textContent = 'Defeat'
    }

    const playedAtElement =
        document.createElement('time')

    playedAtElement.dateTime = match.playedAt
    playedAtElement.textContent =
        new Date(match.playedAt).toLocaleString()

    matchElement.append(
        resultElement,
        outcomeElement,
        playedAtElement,
    )

    return matchElement
}

export const clearMatchHistory = (): void => {
    matchesList.replaceChildren()
    matchesStatus.hidden = false
}

export const loadMatches = async (
    token: string | null,
    authenticatedUser: AuthUser | null,
): Promise<void> => {
    clearMatchHistory()

    if (!token || !authenticatedUser) {
        matchesStatus.textContent =
            'Log in to view your match history.'

        return
    }

    matchesStatus.textContent =
        'Loading your matches...'

    try {
        const matches =
            await fetchMyMatches(token)

        if (matches.length === 0) {
            matchesStatus.textContent =
                'You have not played any matches yet.'

            return
        }

        matchesStatus.hidden = true

        const matchElements = matches
            .slice(0, MATCH_HISTORY_LIMIT)
            .map((match) =>
                createMatchElement(
                    match,
                    authenticatedUser,
                ),
            )

        matchesList.append(...matchElements)
    } catch (error) {
        console.error(
            'Failed to load matches:',
            error,
        )

        matchesStatus.textContent =
            error instanceof Error
                ? error.message
                : 'Failed to load your match history.'
    }
}
