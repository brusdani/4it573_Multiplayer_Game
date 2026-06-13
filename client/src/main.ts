import Phaser from 'phaser'
import './style.css'
import { GameScene } from './scenes/GameScene'
import {
    fetchMatches,
    type Match,
} from './api/matches'
import {
    fetchLeaderboard,
    type LeaderboardEntry,
} from './api/leaderboard'

const homePage =
    document.querySelector<HTMLElement>('#home-page')

const matchesPage =
    document.querySelector<HTMLElement>('#matches-page')

const leaderboardPage =
    document.querySelector<HTMLElement>('#leaderboard-page')

const mainHeader =
    document.querySelector<HTMLElement>('.main-header')

const gameContainer =
    document.querySelector<HTMLElement>('#game-container')

const nicknameForm =
    document.querySelector<HTMLFormElement>('#nickname-form')

const nicknameInput =
    document.querySelector<HTMLInputElement>('#nickname')

const navigationLinks =
    document.querySelectorAll<HTMLAnchorElement>('[data-route]')

const matchesStatus =
    document.querySelector<HTMLElement>('#matches-status')

const matchesList =
    document.querySelector<HTMLElement>('#matches-list')

const leaderboardStatus =
    document.querySelector<HTMLElement>('#leaderboard-status')

const leaderboardList =
    document.querySelector<HTMLElement>('#leaderboard-list')

let game: Phaser.Game | null = null

if (
    !homePage ||
    !matchesPage ||
    !leaderboardPage ||
    !mainHeader ||
    !gameContainer ||
    !nicknameForm ||
    !nicknameInput ||
    !matchesStatus ||
    !matchesList ||
    !leaderboardStatus ||
    !leaderboardList
) {
    throw new Error('Required page elements were not found')
}

const pages = {
    '/': homePage,
    '/matches': matchesPage,
    '/leaderboard': leaderboardPage,
} as const

type Route = keyof typeof pages

const isRoute = (path: string): path is Route => {
    return path in pages
}

const createMatchElement = (match: Match): HTMLElement => {
    const matchElement = document.createElement('article')
    matchElement.className = 'match-card'

    const resultElement = document.createElement('strong')
    resultElement.textContent =
        `${match.player1Nickname} ${match.player1Score}` +
        ` : ${match.player2Score} ${match.player2Nickname}`

    const winnerElement = document.createElement('span')
    winnerElement.textContent = match.winnerNickname
        ? `Winner: ${match.winnerNickname}`
        : 'Draw'

    const playedAtElement = document.createElement('time')
    playedAtElement.dateTime = match.playedAt
    playedAtElement.textContent =
        new Date(match.playedAt).toLocaleString()

    matchElement.append(
        resultElement,
        winnerElement,
        playedAtElement,
    )

    return matchElement
}

const createLeaderboardElement = (
    entry: LeaderboardEntry,
    position: number,
): HTMLElement => {
    const entryElement = document.createElement('article')
    entryElement.className = 'leaderboard-entry'

    const positionElement = document.createElement('strong')
    positionElement.className = 'leaderboard-position'
    positionElement.textContent = `${position}.`

    const nicknameElement = document.createElement('strong')
    nicknameElement.className = 'leaderboard-nickname'
    nicknameElement.textContent = entry.nickname

    const statisticsElement = document.createElement('span')
    statisticsElement.className = 'leaderboard-statistics'
    statisticsElement.textContent =
        `${entry.wins} W · ` +
        `${entry.losses} L · ` +
        `${entry.draws} D · ` +
        `${entry.gamesPlayed} games`

    const winRateElement = document.createElement('span')
    winRateElement.className = 'leaderboard-win-rate'

    const winRatePercentage = Math.round(entry.winRate * 100)

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

const loadMatches = async (): Promise<void> => {
    matchesStatus.hidden = false
    matchesStatus.textContent = 'Loading matches...'
    matchesList.replaceChildren()

    try {
        const matches = await fetchMatches()

        if (matches.length === 0) {
            matchesStatus.textContent =
                'No matches have been played yet.'
            return
        }

        matchesStatus.hidden = true

        const matchElements = matches
            .slice(0, 20)
            .map(createMatchElement)

        matchesList.append(...matchElements)
    } catch (error) {
        console.error('Failed to load matches:', error)

        matchesStatus.textContent =
            error instanceof Error
                ? error.message
                : 'Failed to load match history.'
    }
}

const loadLeaderboard = async (): Promise<void> => {
    leaderboardStatus.hidden = false
    leaderboardStatus.textContent = 'Loading leaderboard...'
    leaderboardList.replaceChildren()

    try {
        const leaderboard = await fetchLeaderboard()

        if (leaderboard.length === 0) {
            leaderboardStatus.textContent =
                'No leaderboard entries are available yet.'
            return
        }

        leaderboardStatus.hidden = true

        const leaderboardElements = leaderboard.map(
            (entry, index) =>
                createLeaderboardElement(entry, index + 1),
        )

        leaderboardList.append(...leaderboardElements)
    } catch (error) {
        console.error('Failed to load leaderboard:', error)

        leaderboardStatus.textContent =
            error instanceof Error
                ? error.message
                : 'Failed to load leaderboard.'
    }
}

const showRoute = (path: string): void => {
    const route: Route = isRoute(path) ? path : '/'

    for (const page of Object.values(pages)) {
        page.hidden = true
    }

    pages[route].hidden = false
    gameContainer.hidden = true
    mainHeader.hidden = false

    if (route === '/matches') {
        void loadMatches()
    }

    if (route === '/leaderboard') {
        void loadLeaderboard()
    }
}

const navigateTo = (path: string): void => {
    window.history.pushState({}, '', path)
    showRoute(path)
}

for (const link of navigationLinks) {
    link.addEventListener('click', (event) => {
        event.preventDefault()

        const route = link.dataset.route

        if (route) {
            navigateTo(route)
        }
    })
}

window.addEventListener('popstate', () => {
    showRoute(window.location.pathname)
})

nicknameForm.addEventListener('submit', (event) => {
    event.preventDefault()

    const nickname = nicknameInput.value.trim()

    if (!nickname || game) {
        return
    }

    for (const page of Object.values(pages)) {
        page.hidden = true
    }

    mainHeader.hidden = true
    gameContainer.hidden = false

    const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.AUTO,
        width: 800,
        height: 600,
        backgroundColor: '#222222',
        parent: 'game-container',
        scene: [new GameScene(nickname)],
    }

    game = new Phaser.Game(config)
})

window.addEventListener('return-to-menu', () => {
    game?.destroy(true)
    game = null

    gameContainer.innerHTML = ''

    window.history.pushState({}, '', '/')
    showRoute('/')
})

showRoute(window.location.pathname)
