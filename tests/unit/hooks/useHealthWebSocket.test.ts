/**
 * @vitest-environment jsdom
 */

import { renderHook, waitFor } from '@testing-library/react'
import { Server, WebSocket as MockSocket } from 'mock-socket'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { useHealthWebSocket } from '@/hooks/useHealthWebSocket'
import { WS_MESSAGE_TYPE_HEALTH_UPDATE } from '@/types/websocket'
import {
  TEST_DATE_CREATED,
  TEST_NUMBER_HUNDRED,
  TEST_NUMBER_ONE,
  TEST_NUMBER_TEN,
  TEST_NUMBER_ZERO,
  TEST_WS_BASE_URL,
  TEST_WS_SERVER_URL,
} from '../../constants'
import { createTestClient } from '../../utils/testClient'

const createServer = () => new Server(TEST_WS_SERVER_URL)
const createFactory = () => vi.fn((url: string) => new MockSocket(url) as unknown as WebSocket)

describe('useHealthWebSocket', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns parsed health data when receiving health updates', async () => {
    const server = createServer()
    let serverSocket: WebSocket | null = null
    server.on('connection', (socket) => {
      serverSocket = socket
    })

    const client = createTestClient(TEST_WS_BASE_URL)
    const webSocketFactory = createFactory()
    const { result, unmount } = renderHook(() =>
      useHealthWebSocket(client, {
        webSocketFactory,
      })
    )

    await waitFor(() => {
      expect(result.current.connected).toBe(true)
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
      },
    }

    serverSocket?.send(JSON.stringify(payload))

    await waitFor(() => {
      expect(result.current.healthData?.system.uptime).toBe(TEST_NUMBER_TEN)
    })

    unmount()
    server.stop()
  })
})

