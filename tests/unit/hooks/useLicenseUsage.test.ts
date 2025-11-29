/**
 * Tests for useLicenseUsage hook
 * @vitest-environment jsdom
 */

import { renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Client } from '@/client'
import { useLicenseUsage } from '@/hooks/useLicenseUsage'
import { createQueryClientWrapper } from '../../utils/reactQueryWrapper'
import { createTestClient } from '../../utils/testClient'
import { TEST_LICENSE_KEY, TEST_DOMAIN } from '../../constants'
import { createSuccessResponse, createHttpResponse } from '../../factories/response'

describe('useLicenseUsage', () => {
  it('should report usage successfully', async () => {
    const client = createTestClient()
    const mockPost = vi.fn().mockResolvedValue(createHttpResponse(createSuccessResponse({ success: true })))
    // @ts-expect-error - accessing private property for testing
    client.httpClient.post = mockPost

    const wrapper = createQueryClientWrapper()
    const { result } = renderHook(() => useLicenseUsage(client), { wrapper })

    result.current.mutate({
      license_key: TEST_LICENSE_KEY,
      domain: TEST_DOMAIN,
      month: '2024-01',
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })
  })

  it('should handle usage report error', async () => {
    const client = createTestClient()
    const mockPost = vi.fn().mockRejectedValue(new Error('Report failed'))
    // @ts-expect-error - accessing private property for testing
    client.httpClient.post = mockPost

    const wrapper = createQueryClientWrapper()
    const { result } = renderHook(() => useLicenseUsage(client), { wrapper })

    result.current.mutate({
      license_key: TEST_LICENSE_KEY,
      domain: TEST_DOMAIN,
      month: '2024-01',
    })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.error).toBeDefined()
  })
})

