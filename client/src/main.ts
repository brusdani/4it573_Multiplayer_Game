import Phaser from 'phaser'
import './style.css'
import { GameScene } from './scenes/GameScene'
import {
    fetchMyMatches,
    type Match,
} from './api/matches'
import {
    fetchLeaderboard,
    type LeaderboardEntry,
} from './api/leaderboard'
import {
    getCurrentUser,
    login,
    logout,
    register,
    type AuthUser,
} from './api/auth'

const AUTH_TOKEN_KEY = 'authToken'
const LEADERBOARD_LIMIT = 10

const homePage =
    document.querySelector<HTMLElement>('#home-page')

const loginPage =
    document.querySelector<HTMLElement>('#login-page')

const registerPage =
    document.querySelector<HTMLElement>('#register-page')

const matchesPage =
    document.querySelector<HTMLElement>('#matches-page')

const leaderboardPage =
    document.querySelector<HTMLElement>('#leaderboard-page')

const mainHeader =
    document.querySelector<HTMLElement>('.main-header')

const gameContainer =
    document.querySelector<HTMLElement>('#game-container')

const guestPanel =
    document.querySelector<HTMLElement>('#guest-panel')

const playerPanel =
    document.querySelector<HTMLElement>('#player-panel')

const currentUsername =
    document.querySelector<HTMLElement>('#current-username')

const playButton =
    document.querySelector<HTMLButtonElement>('#play-button')

const logoutButton =
    document.querySelector<HTMLButtonElement>('#logout-button')

const loginForm =
    document.querySelector<HTMLFormElement>('#login-form')

const loginUsernameInput =
    document.querySelector<HTMLInputElement>(
        '#login-username',
    )

const loginPasswordInput =
    document.querySelector<HTMLInputElement>(
        '#login-password',
    )

const loginStatus =
    document.querySelector<HTMLElement>('#login-status')

const registerForm =
    document.querySelector<HTMLFormElement>('#register-form')

const registerUsernameInput =
    document.querySelector<HTMLInputElement>(
        '#register-username',
    )

const registerPasswordInput =
    document.querySelector<HTMLInputElement>(
        '#register-password',
    )

const registerStatus =
    document.querySelector<HTMLElement>('#register-status')

const registerNavigationLink =
    document.querySelector<HTMLAnchorElement>(
        '#register-navigation-link',
    )

const authNavigationLink =
    document.querySelector<HTMLAnchorElement>(
        '#auth-navigation-link',
    )

const navigationLinks =
    document.querySelectorAll<HTMLAnchorElement>(
        '[data-route]',
    )

const matchesStatus =
    document.querySelector<HTMLElement>('#matches-status')

const matchesList =
    document.querySelector<HTMLElement>('#matches-list')

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

let game: Phaser.Game | null = null

let authenticatedUser: AuthUser | null = null

let authToken: string | null =
    sessionStorage.getItem(AUTH_TOKEN_KEY)

if (
    !homePage ||
    !loginPage ||
    !registerPage ||
    !matchesPage ||
    !leaderboardPage ||
    !mainHeader ||
    !gameContainer ||
    !guestPanel ||
    !playerPanel ||
    !currentUsername ||
    !playButton ||
    !logoutButton ||
    !loginForm ||
    !loginUsernameInput ||
    !loginPasswordInput ||
    !loginStatus ||
    !registerForm ||
    !registerUsernameInput ||
    !registerPasswordInput ||
    !registerStatus ||
    !registerNavigationLink ||
    !authNavigationLink ||
    !matchesStatus ||
    !matchesList ||
    !leaderboardStatus ||
    !leaderboardList ||
    !currentPlayerSection ||
    !currentPlayerPosition
) {
    throw new Error('Required page elements were not found')
}

const pages = {
    '/': homePage,
    '/login': loginPage,
    '/register': registerPage,
    '/matches': matchesPage,
    '/leaderboard': leaderboardPage,
} as const

type Route = keyof typeof pages

const isRoute = (path: string): path is Route => {
    return path in pages
}

const updateAuthenticationDisplay = (): void => {
    const isAuthenticated = authenticatedUser !== null

    guestPanel.hidden = isAuthenticated
    playerPanel.hidden = !isAuthenticated

    currentUsername.textContent =
        authenticatedUser?.username ?? ''

    registerNavigationLink.hidden = isAuthenticated

    authNavigationLink.textContent =
        isAuthenticated ? 'Logout' : 'Login'

    authNavigationLink.href =
        isAuthenticated ? '/' : '/login'
}

const storeAuthentication = (
    token: string,
    user: AuthUser,
): void => {
    authToken = token
    authenticatedUser = user

    sessionStorage.setItem(AUTH_TOKEN_KEY, token)

    updateAuthenticationDisplay()
}

const clearAuthentication = (): void => {
    authToken = null
    authenticatedUser = null

    sessionStorage.removeItem(AUTH_TOKEN_KEY)

    currentPlayerSection.hidden = true
    currentPlayerPosition.replaceChildren()

    updateAuthenticationDisplay()
}

const createMatchElement = (
    match: Match,
): HTMLElement => {
    const matchElement = document.createElement('article')
    matchElement.className = 'match-card'

    const currentPlayerNickname =
        authenticatedUser?.username

    const isDraw = match.winnerNickname === null
    const isWin =
        match.winnerNickname === currentPlayerNickname

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

    const winnerElement =
        document.createElement('span')

    if (isDraw) {
        winnerElement.textContent = 'Draw'
    } else if (isWin) {
        winnerElement.textContent = 'Victory'
    } else {
        winnerElement.textContent = 'Defeat'
    }

    const playedAtElement =
        document.createElement('time')

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

const loadMatches = async (): Promise<void> => {
    matchesStatus.hidden = false
    matchesStatus.textContent = 'Loading matches...'
    matchesList.replaceChildren()

    const token = authToken
    if (!token || !authenticatedUser) {
        matchesStatus.textContent =
            'Log in to view your match history'

        return
    }
    matchesStatus.textContent = 'Loading your matches...'

    try {
        const matches = await fetchMyMatches(token)

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

const loadLeaderboard = async (): Promise<void> => {
    leaderboardStatus.hidden = false
    leaderboardStatus.textContent =
        'Loading leaderboard...'

    leaderboardList.replaceChildren()
    currentPlayerPosition.replaceChildren()
    currentPlayerSection.hidden = true

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
                    authenticatedUser?.id,
            )

        if (currentPlayerIndex === -1) {
            return
        }

        const currentPlayer =
            leaderboard[currentPlayerIndex]

        const currentPlayerElement =
            createLeaderboardElement(
                currentPlayer,
                currentPlayerIndex + 1,
                true,
            )

        currentPlayerPosition.append(
            currentPlayerElement,
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

const showRoute = (path: string): void => {
    const route: Route =
        isRoute(path) ? path : '/'

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

const performLogout = async (): Promise<void> => {
    if (authToken) {
        try {
            await logout(authToken)
        } catch (error) {
            console.error('Logout failed:', error)
        }
    }

    clearAuthentication()
    navigateTo('/')
}

const startGame = (): void => {
    if (!authenticatedUser || !authToken || game) {
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
        scene: [
            new GameScene(authToken),
        ],
    }

    game = new Phaser.Game(config)
}

const restoreAuthentication =
    async (): Promise<void> => {
        if (!authToken) {
            updateAuthenticationDisplay()
            return
        }

        try {
            authenticatedUser =
                await getCurrentUser(authToken)
        } catch (error) {
            console.error(
                'Failed to restore authentication:',
                error,
            )

            clearAuthentication()
            return
        }

        updateAuthenticationDisplay()
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

authNavigationLink.addEventListener(
    'click',
    async (event) => {
        event.preventDefault()

        if (!authenticatedUser) {
            navigateTo('/login')
            return
        }

        await performLogout()
    },
)

window.addEventListener('popstate', () => {
    showRoute(window.location.pathname)
})

loginForm.addEventListener(
    'submit',
    async (event) => {
        event.preventDefault()

        loginStatus.textContent = 'Logging in...'

        try {
            const result = await login(
                loginUsernameInput.value,
                loginPasswordInput.value,
            )

            storeAuthentication(
                result.token,
                result.user,
            )

            loginForm.reset()
            loginStatus.textContent = ''

            navigateTo('/')
        } catch (error) {
            loginStatus.textContent =
                error instanceof Error
                    ? error.message
                    : 'Login failed.'
        }
    },
)

registerForm.addEventListener(
    'submit',
    async (event) => {
        event.preventDefault()

        registerStatus.textContent =
            'Creating account...'

        try {
            const result = await register(
                registerUsernameInput.value,
                registerPasswordInput.value,
            )

            storeAuthentication(
                result.token,
                result.user,
            )

            registerForm.reset()
            registerStatus.textContent = ''

            navigateTo('/')
        } catch (error) {
            registerStatus.textContent =
                error instanceof Error
                    ? error.message
                    : 'Registration failed.'
        }
    },
)

playButton.addEventListener('click', () => {
    startGame()
})

logoutButton.addEventListener(
    'click',
    async () => {
        await performLogout()
    },
)

window.addEventListener(
    'return-to-menu',
    () => {
        game?.destroy(true)
        game = null

        gameContainer.innerHTML = ''

        window.history.pushState({}, '', '/')
        showRoute('/')
    },
)

const initialiseApplication =
    async (): Promise<void> => {
        await restoreAuthentication()
        showRoute(window.location.pathname)
    }

void initialiseApplication()
