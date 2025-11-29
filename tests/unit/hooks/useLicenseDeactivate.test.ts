/**
 * Tests for useLicenseDeactivate hook
 * @vitest-environment jsdom
 */

import { renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Client } from '@/client'
import { useLicenseDeactivate } from '@/hooks/useLicenseDeactivate'
import { createQueryClientWrapper } from '../../utils/reactQueryWrapper'
import { createTestClient } from '../../utils/testClient'
import { TEST_LICENSE_KEY, TEST_DOMAIN, TEST_BOOLEAN_TRUE } from '../../constants'
import { createSuccessResponse, createHttpResponse } from '../../factories/response'

describe('useLicenseDeactivate', () => {
  it('should deactivate license successfully', async () => {
    const client = createTestClient()
    const mockPost = vi.fn().mockResolvedValue(createHttpResponse(createSuccessResponse({ success: TEST_BOOLEAN_TRUE })))
    // @ts-expect-error - accessing private property for testing
    client.httpClient.post = mockPost

    const wrapper = createQueryClientWrapper()
    const { result } = renderHook(() => useLicenseDeactivate(client), { wrapper })

    result.current.mutate({
      licenseKey: TEST_LICENSE_KEY,
      domain: TEST_DOMAIN,
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data?.success).toBe(TEST_BOOLEAN_TRUE)
  })

  it('should handle deactivation error', async () => {
    const client = createTestClient()
    const mockPost = vi.fn().mockRejectedValue(new Error('Deactivation failed'))
    // @ts-expect-error - accessing private property for testing
    client.httpClient.post = mockPost

    const wrapper = createQueryClientWrapper()
    const { result } = renderHook(() => useLicenseDeactivate(client), { wrapper })

    result.current.mutate({
      licenseKey: TEST_LICENSE_KEY,
      domain: TEST_DOMAIN,
    })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.error).toBeDefined()
  })
})

