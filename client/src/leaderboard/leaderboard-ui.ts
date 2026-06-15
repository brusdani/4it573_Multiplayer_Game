import {
    fetchLeaderboard,
    type LeaderboardEntry,
} from '../api/leaderboard'
import type { AuthUser } from '../api/auth'

const LEADERBOARD_LIMIT = 10

const leaderboardStatus =
    document.querySelector<HTMLElement>(
        '#leaderboard-status',
    )

const leaderboardList =
    document.querySelector<HTMLElement>(
        '#leaderboard-list',
    )

const currentPlayerSection =
    document.querySelector<HTMLElement>(
        '#current-player-section',
    )

const currentPlayerPosition =
    document.querySelector<HTMLElement>(
        '#current-player-position',
    )

if (
    !leaderboardStatus ||
    !leaderboardList ||
    !currentPlayerSection ||
    !currentPlayerPosition
) {
    throw new Error(
        'Required leaderboard elements were not found',
    )
}

const createLeaderboardElement = (
    entry: LeaderboardEntry,
    position: number,
    isCurrentPlayer = false,
): HTMLElement => {
    const entryElement =
        document.createElement('article')

    entryElement.className = 'leaderboard-entry'

    if (isCurrentPlayer) {
        entryElement.classList.add(
            'current-player-entry',
        )
    }

    const positionElement =
        document.createElement('strong')

    positionElement.className =
        'leaderboard-position'

    positionElement.textContent = `${position}.`

    const nicknameElement =
        document.createElement('strong')

    nicknameElement.className =
        'leaderboard-nickname'

    nicknameElement.textContent = entry.nickname

    const statisticsElement =
        document.createElement('span')

    statisticsElement.className =
        'leaderboard-statistics'

    statisticsElement.textContent =
        `${entry.wins} W · ` +
        `${entry.losses} L · ` +
        `${entry.draws} D · ` +
        `${entry.gamesPlayed} games`

    const winRateElement =
        document.createElement('span')

    winRateElement.className =
        'leaderboard-win-rate'

    const winRatePercentage =
        Math.round(entry.winRate * 100)

    winRateElement.textContent =
        `${winRatePercentage}% win rate`

    entryElement.append(
        positionElement,
        nicknameElement,
        statisticsElement,
        winRateElement,
    )

    return entryElement
}

export const clearCurrentPlayerPosition =
    (): void => {
        currentPlayerSection.hidden = true
        currentPlayerPosition.replaceChildren()
    }

export const loadLeaderboard = async (
    authenticatedUser: AuthUser | null,
): Promise<void> => {
    leaderboardStatus.hidden = false
    leaderboardStatus.textContent =
        'Loading leaderboard...'

    leaderboardList.replaceChildren()
    clearCurrentPlayerPosition()

    try {
        const leaderboard =
            await fetchLeaderboard()

        if (leaderboard.length === 0) {
            leaderboardStatus.textContent =
                'No leaderboard entries are available yet.'

            return
        }

        leaderboardStatus.hidden = true

        const topPlayers = leaderboard.slice(
            0,
            LEADERBOARD_LIMIT,
        )

        const topPlayerElements = topPlayers.map(
            (entry, index) =>
                createLeaderboardElement(
                    entry,
                    index + 1,
                    entry.userId ===
                        authenticatedUser?.id,
                ),
        )

        leaderboardList.append(...topPlayerElements)

        if (!authenticatedUser) {
            return
        }

        const currentPlayerIndex =
            leaderboard.findIndex(
                (entry) =>
                    entry.userId ===
                    authenticatedUser.id,
            )

        if (currentPlayerIndex === -1) {
            return
        }

        const currentPlayer =
            leaderboard[currentPlayerIndex]

        currentPlayerPosition.append(
            createLeaderboardElement(
                currentPlayer,
                currentPlayerIndex + 1,
                true,
            ),
        )

        currentPlayerSection.hidden = false
    } catch (error) {
        console.error(
            'Failed to load leaderboard:',
            error,
        )

        leaderboardStatus.textContent =
            error instanceof Error
                ? error.message
                : 'Failed to load leaderboard.'
    }
}
