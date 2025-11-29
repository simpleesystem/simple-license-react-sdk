/**
 * Tests for useLicenseValidate hook
 * @vitest-environment jsdom
 */

import { renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Client } from '@/client'
import { useLicenseValidate } from '@/hooks/useLicenseValidate'
import { createQueryClientWrapper } from '../../utils/reactQueryWrapper'
import { createTestClient } from '../../utils/testClient'
import { TEST_LICENSE_KEY, TEST_DOMAIN } from '../../constants'
import { createSuccessResponse, createHttpResponse } from '../../factories/response'
import { createLicense } from '../../factories/license'

describe('useLicenseValidate', () => {
  it('should validate license successfully', async () => {
    const client = createTestClient()
    const license = createLicense({ licenseKey: TEST_LICENSE_KEY })
    const mockPost = vi.fn().mockResolvedValue(createHttpResponse(createSuccessResponse({ license })))
    // @ts-expect-error - accessing private property for testing
    client.httpClient.post = mockPost

    const wrapper = createQueryClientWrapper()
    const { result } = renderHook(() => useLicenseValidate(client), { wrapper })

    result.current.mutate({
      licenseKey: TEST_LICENSE_KEY,
      domain: TEST_DOMAIN,
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data?.license).toBeDefined()
    expect(result.current.data?.license.licenseKey).toBe(TEST_LICENSE_KEY)
  })

  it('should handle validation error', async () => {
    const client = createTestClient()
    const mockPost = vi.fn().mockRejectedValue(new Error('Validation failed'))
    // @ts-expect-error - accessing private property for testing
    client.httpClient.post = mockPost

    const wrapper = createQueryClientWrapper()
    const { result } = renderHook(() => useLicenseValidate(client), { wrapper })

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

