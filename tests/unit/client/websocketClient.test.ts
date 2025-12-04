/**
 * @vitest-environment jsdom
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { WebSocketClient } from '@/client/websocketClient'
import {
  WS_MESSAGE_TYPE_HEALTH_UPDATE,
  WS_MESSAGE_TYPE_REQUEST_HEALTH,
  WS_STATE_CONNECTED,
  WS_STATE_DISCONNECTED,
} from '@/types/websocket'
import {
  TEST_BASE_URL,
  TEST_DATE_CREATED,
  TEST_NUMBER_HUNDRED,
  TEST_NUMBER_ONE,
  TEST_NUMBER_TEN,
  TEST_NUMBER_ZERO,
  TEST_STRING_VALUE,
  TEST_TIMEOUT_SHORT,
} from '../../constants'
import { MockWebSocket } from '../../utils/mockWebSocket'

describe('WebSocketClient', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('connects and dispatches health update messages to listeners', () => {
    const mockSocket = new MockWebSocket(TEST_BASE_URL)
    const factory = vi.fn(() => mockSocket as unknown as WebSocket)
    const client = new WebSocketClient(TEST_BASE_URL, { webSocketFactory: factory })
    const messageListener = vi.fn()
    const stateListener = vi.fn()
    client.addMessageListener(messageListener)
    client.addStateListener(stateListener)

    client.connect()
    mockSocket.open()

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

    mockSocket.emitMessage(JSON.stringify(payload))

    expect(factory).toHaveBeenCalledTimes(1)
    expect(stateListener).toHaveBeenCalledWith(expect.objectContaining({ state: WS_STATE_CONNECTED }))
    expect(messageListener).toHaveBeenCalledWith(expect.objectContaining({ type: WS_MESSAGE_TYPE_HEALTH_UPDATE }))
  })

  it('sends request health messages when connected', () => {
    const mockSocket = new MockWebSocket(TEST_BASE_URL)
    const client = new WebSocketClient(TEST_BASE_URL, {
      webSocketFactory: () => mockSocket as unknown as WebSocket,
    })

    client.connect()
    mockSocket.open()

    const sent = client.requestHealth()
    expect(sent).toBe(true)
    expect(mockSocket.sentMessages).toHaveLength(TEST_NUMBER_ONE)
    const parsed = JSON.parse(mockSocket.sentMessages[TEST_NUMBER_ZERO])
    expect(parsed.type).toBe(WS_MESSAGE_TYPE_REQUEST_HEALTH)
  })

  it('schedules reconnect after unexpected closure', () => {
    const sockets: MockWebSocket[] = []
    const factory = vi.fn(() => {
      const socket = new MockWebSocket(TEST_BASE_URL)
      sockets.push(socket)
      return socket as unknown as WebSocket
    })

    const client = new WebSocketClient(TEST_BASE_URL, {
      webSocketFactory: factory,
      reconnectIntervalMs: TEST_TIMEOUT_SHORT,
    })
    client.connect()
    sockets[TEST_NUMBER_ZERO].open()

    sockets[TEST_NUMBER_ZERO].close()
    expect(client.getConnectionInfo().state).toBe(WS_STATE_DISCONNECTED)

    vi.advanceTimersByTime(TEST_TIMEOUT_SHORT)

    expect(factory).toHaveBeenCalledTimes(TEST_NUMBER_ONE + TEST_NUMBER_ONE)
  })

  it('does not reconnect after manual disconnect', () => {
    const sockets: MockWebSocket[] = []
    const factory = vi.fn(() => {
      const socket = new MockWebSocket(TEST_BASE_URL)
      sockets.push(socket)
      return socket as unknown as WebSocket
    })

    const client = new WebSocketClient(TEST_BASE_URL, {
      webSocketFactory: factory,
      reconnectIntervalMs: TEST_TIMEOUT_SHORT,
    })
    client.connect()
    sockets[TEST_NUMBER_ZERO].open()

    client.disconnect()
    expect(client.getConnectionInfo().state).toBe(WS_STATE_DISCONNECTED)

    vi.advanceTimersByTime(TEST_TIMEOUT_SHORT * TEST_NUMBER_TEN)
    expect(factory).toHaveBeenCalledTimes(TEST_NUMBER_ONE)
  })
})

