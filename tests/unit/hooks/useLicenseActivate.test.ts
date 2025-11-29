/**
 * Tests for useLicenseActivate hook
 * @vitest-environment jsdom
 */

import { renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Client } from '@/client'
import { useLicenseActivate } from '@/hooks/useLicenseActivate'
import { createQueryClientWrapper } from '../../utils/reactQueryWrapper'
import { createTestClient } from '../../utils/testClient'
import { TEST_LICENSE_KEY, TEST_DOMAIN } from '../../constants'
import { createSuccessResponse, createHttpResponse } from '../../factories/response'
import { createLicense } from '../../factories/license'

describe('useLicenseActivate', () => {
  it('should activate license successfully', async () => {
    const client = createTestClient()
    const license = createLicense({ licenseKey: TEST_LICENSE_KEY })
    const activationData = {
      license,
      activation: {
        id: 'activation-123',
        licenseKey: TEST_LICENSE_KEY,
        domain: TEST_DOMAIN,
        status: 'ACTIVE' as const,
        activatedAt: new Date().toISOString(),
      },
    }
    const mockPost = vi.fn().mockResolvedValue(createHttpResponse(createSuccessResponse(activationData)))
    // @ts-expect-error - accessing private property for testing
    client.httpClient.post = mockPost

    const wrapper = createQueryClientWrapper()
    const { result } = renderHook(() => useLicenseActivate(client), { wrapper })

    result.current.mutate({
      licenseKey: TEST_LICENSE_KEY,
      domain: TEST_DOMAIN,
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data?.license).toBeDefined()
    expect(result.current.data?.activation).toBeDefined()
  })

  it('should handle activation error', async () => {
    const client = createTestClient()
    const mockPost = vi.fn().mockRejectedValue(new Error('Activation failed'))
    // @ts-expect-error - accessing private property for testing
    client.httpClient.post = mockPost

    const wrapper = createQueryClientWrapper()
    const { result } = renderHook(() => useLicenseActivate(client), { wrapper })

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

