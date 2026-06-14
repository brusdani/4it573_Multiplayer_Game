import test from 'ava'
import {
    parseClientMessage,
} from '../dist/websocket/ws.validation.js'

test('parses a valid authentication message', (t) => {
    const result = parseClientMessage(
        JSON.stringify({
            type: 'authenticate',
            token: 'valid-session-token',
        }),
    )

    t.deepEqual(result, {
        type: 'authenticate',
        token: 'valid-session-token',
    })
})

test('rejects an empty authentication token', (t) => {
    const result = parseClientMessage(
        JSON.stringify({
            type: 'authenticate',
            token: '',
        }),
    )

    t.is(result, null)
})

test('rejects an authentication message without a token', (t) => {
    const result = parseClientMessage(
        JSON.stringify({
            type: 'authenticate',
        }),
    )

    t.is(result, null)
})

test('parses a valid join message', (t) => {
    const result = parseClientMessage(
        JSON.stringify({
            type: 'join',
        }),
    )

    t.deepEqual(result, {
        type: 'join',
    })
})

test('parses a valid input message', (t) => {
    const result = parseClientMessage(
        JSON.stringify({
            type: 'input',
            input: {
                left: true,
                right: false,
                jump: true,
            },
        }),
    )

    t.deepEqual(result, {
        type: 'input',
        input: {
            left: true,
            right: false,
            jump: true,
        },
    })
})

test('rejects an invalid input message', (t) => {
    const result = parseClientMessage(
        JSON.stringify({
            type: 'input',
            input: {
                left: true,
                right: 'false',
                jump: true,
            },
        }),
    )

    t.is(result, null)
})

test('parses a queue message', (t) => {
    const result = parseClientMessage(
        JSON.stringify({
            type: 'queue',
        }),
    )

    t.deepEqual(result, {
        type: 'queue',
    })
})

test('rejects malformed JSON', (t) => {
    const result = parseClientMessage(
        '{invalid json',
    )

    t.is(result, null)
})
