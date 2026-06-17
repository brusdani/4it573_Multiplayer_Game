import './style.css'
import {
    ensureGameHidden,
    hideGame,
    showGame,
} from './game/game-controller'
import {
    clearMatchHistory,
    loadMatches,
} from './matches/matches-ui'
import {
    clearCurrentPlayerPosition,
    loadLeaderboard,
} from './leaderboard/leaderboard-ui'
import {
    getCurrentUser,
    login,
    logout,
    register,
    type AuthUser,
} from './api/auth'

const AUTH_TOKEN_KEY = 'authToken'

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

let authenticatedUser: AuthUser | null = null

let authToken: string | null =
    sessionStorage.getItem(AUTH_TOKEN_KEY)

if (
    !homePage ||
    !loginPage ||
    !registerPage ||
    !matchesPage ||
    !leaderboardPage ||
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
    !authNavigationLink
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

    clearCurrentPlayerPosition()
    clearMatchHistory()
    updateAuthenticationDisplay()
}

const showRoute = (path: string): void => {
    const route: Route =
        isRoute(path) ? path : '/'

    for (const page of Object.values(pages)) {
        page.hidden = true
    }

    pages[route].hidden = false
    ensureGameHidden()

    if (route === '/matches') {
        void loadMatches(
            authToken,
            authenticatedUser,
        )
    }
    if (route === '/leaderboard') {
        void loadLeaderboard(authenticatedUser)
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
    const token = authToken

    if (!authenticatedUser || !token) {
        return
    }

    showGame(
        token,
        Object.values(pages),
    )
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
        hideGame()

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
