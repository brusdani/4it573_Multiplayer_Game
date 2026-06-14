import type { ClientMessage } from './ws.types.js'

const isObject = (
    value: unknown,
): value is Record<string, unknown> => {
    return typeof value === 'object' && value !== null
}

const isBoolean = (value: unknown): value is boolean => {
    return typeof value === 'boolean'
}

const isAuthenticateMessage = (
    value: Record<string, unknown>,
): value is Extract<
    ClientMessage,
    { type: 'authenticate' }
> => {
    return (
        value.type === 'authenticate' &&
        typeof value.token === 'string' &&
        value.token.length > 0 &&
        value.token.length <= 256
    )
}

const isJoinMessage = (
    value: Record<string, unknown>,
): value is Extract<ClientMessage, { type: 'join' }> => {
    return value.type === 'join'
}

const isInputMessage = (
    value: Record<string, unknown>,
): value is Extract<ClientMessage, { type: 'input' }> => {
    if (
        value.type !== 'input' ||
        !isObject(value.input)
    ) {
        return false
    }

    return (
        isBoolean(value.input.left) &&
        isBoolean(value.input.right) &&
        isBoolean(value.input.jump)
    )
}

const isQueueMessage = (
    value: Record<string, unknown>,
): value is Extract<ClientMessage, { type: 'queue' }> => {
    return value.type === 'queue'
}

export const parseClientMessage = (
    rawData: unknown,
): ClientMessage | null => {
    let parsedData: unknown

    try {
        parsedData = JSON.parse(String(rawData))
    } catch {
        return null
    }

    if (!isObject(parsedData)) {
        return null
    }

    if (isAuthenticateMessage(parsedData)) {
        return {
            type: 'authenticate',
            token: parsedData.token,
        }
    }

    if (isJoinMessage(parsedData)) {
        return {
            type: 'join',
        }
    }

    if (isInputMessage(parsedData)) {
        return {
            type: 'input',
            input: {
                left: parsedData.input.left,
                right: parsedData.input.right,
                jump: parsedData.input.jump,
            },
        }
    }

    if (isQueueMessage(parsedData)) {
        return {
            type: 'queue',
        }
    }

    return null
}