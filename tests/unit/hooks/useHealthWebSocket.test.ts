/**
 * @vitest-environment jsdom
 */

import { renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { useHealthWebSocket } from '@/hooks/useHealthWebSocket'
import { WS_MESSAGE_TYPE_HEALTH_UPDATE } from '@/types/websocket'
import {
  TEST_BASE_URL,
  TEST_DATE_CREATED,
  TEST_NUMBER_HUNDRED,
  TEST_NUMBER_ONE,
  TEST_NUMBER_TEN,
  TEST_NUMBER_ZERO,
} from '../../constants'
import { MockWebSocket } from '../../utils/mockWebSocket'
import { createTestClient } from '../../utils/testClient'

describe('useHealthWebSocket', () => {
  it('returns parsed health data when receiving health updates', async () => {
    const client = createTestClient()
    const mockSocket = new MockWebSocket(TEST_BASE_URL)
    const { result, unmount } = renderHook(() =>
      useHealthWebSocket(client, {
        webSocketFactory: () => mockSocket as unknown as WebSocket,
      })
    )

    mockSocket.open()
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

    mockSocket.emitMessage(JSON.stringify(payload))

    await waitFor(() => {
      expect(result.current.healthData?.system.uptime).toBe(TEST_NUMBER_TEN)
    })

    unmount()
  })
})

