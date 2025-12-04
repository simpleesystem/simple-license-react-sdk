/**
 * @vitest-environment jsdom
 */

import { waitFor } from '@testing-library/react'
import { Server, WebSocket as MockSocket } from 'mock-socket'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { WebSocketClient } from '@/client/websocketClient'
import {
  WS_MESSAGE_TYPE_HEALTH_UPDATE,
  WS_MESSAGE_TYPE_REQUEST_HEALTH,
  WS_STATE_CONNECTED,
  WS_STATE_DISCONNECTED,
} from '@/types/websocket'
import {
  TEST_DATE_CREATED,
  TEST_NUMBER_HUNDRED,
  TEST_NUMBER_ONE,
  TEST_NUMBER_TEN,
  TEST_NUMBER_ZERO,
  TEST_STRING_VALUE,
  TEST_TIMEOUT_SHORT,
  TEST_WS_BASE_URL,
  TEST_WS_SERVER_URL,
} from '../../constants'

const createServer = () => new Server(TEST_WS_SERVER_URL)
const createFactory = () => {
  return vi.fn((url: string) => new MockSocket(url) as unknown as WebSocket)
}

describe('WebSocketClient', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('connects and dispatches health update messages to listeners', async () => {
    const server = createServer()
    let serverSocket: WebSocket | null = null
    server.on('connection', (socket) => {
      serverSocket = socket
    })

    const factory = createFactory()
    const client = new WebSocketClient(TEST_WS_BASE_URL, { webSocketFactory: factory })
    const messageListener = vi.fn()
    const stateListener = vi.fn()
    client.addMessageListener(messageListener)
    client.addStateListener(stateListener)

    client.connect()
    await waitFor(() => {
      expect(stateListener).toHaveBeenCalledWith(expect.objectContaining({ state: WS_STATE_CONNECTED }))
    })

    const payload = {
      type: WS_MESSAGE_TYPE_HEALTH_UPDATE,
      timestamp: TEST_DATE_CREATED.toISOString(),
      data: {
        system: {
          uptime: TEST_NUMBER_TEN,
          memory: {
            heap_used: TEST_NUMBER_ONE,
            heap_total: TEST_NUMBER_TEN,
            usage_percent: TEST_NUMBER_HUNDRED,
          },
          clients_connected: TEST_NUMBER_ONE,
        },
        licenses: {
          total: TEST_NUMBER_HUNDRED,
          active: TEST_NUMBER_TEN,
          expired: TEST_NUMBER_ONE,
          demo_mode: TEST_NUMBER_ZERO,
          customers: TEST_NUMBER_TEN,
          recent: TEST_NUMBER_ONE,
        },
        security: {
          failed_logins_last_hour: TEST_NUMBER_ZERO,
        },
        database: {
          active_connections: TEST_NUMBER_ONE,
        },
        stats: {
          active_licenses: TEST_NUMBER_TEN,
          expired_licenses: TEST_NUMBER_ONE,
          total_customers: TEST_NUMBER_ONE,
          total_activations: TEST_NUMBER_HUNDRED,
        },
      },
    }

    serverSocket?.send(JSON.stringify(payload))

    await waitFor(() => {
      expect(factory).toHaveBeenCalledTimes(1)
      expect(messageListener).toHaveBeenCalledWith(expect.objectContaining({ type: WS_MESSAGE_TYPE_HEALTH_UPDATE }))
    })

    server.stop()
  })

  it('sends request health messages when connected', async () => {
    const server = createServer()
    const messages: Array<Record<string, unknown>> = []
    server.on('connection', (socket) => {
      socket.on('message', (data) => {
        messages.push(JSON.parse(data as string))
      })
    })

    const client = new WebSocketClient(TEST_WS_BASE_URL)
    client.connect()

    await waitFor(() => {
      expect(client.getConnectionInfo().state).toBe(WS_STATE_CONNECTED)
    })

    const sent = client.requestHealth()
    expect(sent).toBe(true)

    await waitFor(() => {
      expect(messages).toHaveLength(TEST_NUMBER_ONE)
      expect(messages[TEST_NUMBER_ZERO].type).toBe(WS_MESSAGE_TYPE_REQUEST_HEALTH)
    })

    server.stop()
  })

  it('schedules reconnect after unexpected closure', async () => {
    vi.useFakeTimers()
    const server = createServer()
    let connectionCount = 0
    const sockets: WebSocket[] = []
    server.on('connection', (socket) => {
      connectionCount += 1
      sockets.push(socket)
    })

    const client = new WebSocketClient(TEST_WS_BASE_URL, {
      reconnectIntervalMs: TEST_TIMEOUT_SHORT,
    })
    client.connect()

    await waitFor(() => {
      expect(connectionCount).toBe(TEST_NUMBER_ONE)
    })

    sockets[TEST_NUMBER_ZERO]?.close()

    await waitFor(() => {
      expect(client.getConnectionInfo().state).toBe(WS_STATE_DISCONNECTED)
    })

    vi.advanceTimersByTime(TEST_TIMEOUT_SHORT)

    await waitFor(() => {
      expect(connectionCount).toBe(TEST_NUMBER_ONE + TEST_NUMBER_ONE)
    })

    vi.useRealTimers()
    server.stop()
  })

  it('does not reconnect after manual disconnect', async () => {
    vi.useFakeTimers()
    const server = createServer()
    let connectionCount = 0
    const sockets: WebSocket[] = []
    server.on('connection', (socket) => {
      connectionCount += 1
      sockets.push(socket)
    })

    const client = new WebSocketClient(TEST_WS_BASE_URL, {
      reconnectIntervalMs: TEST_TIMEOUT_SHORT,
    })
    client.connect()
    await waitFor(() => {
      expect(connectionCount).toBe(TEST_NUMBER_ONE)
    })

    client.disconnect()
    expect(client.getConnectionInfo().state).toBe(WS_STATE_DISCONNECTED)

    vi.advanceTimersByTime(TEST_TIMEOUT_SHORT * TEST_NUMBER_TEN)
    expect(connectionCount).toBe(TEST_NUMBER_ONE)

    vi.useRealTimers()
    server.stop()
  })
})

