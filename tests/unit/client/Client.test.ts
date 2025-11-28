import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Client } from '@/client'
import {
  ERROR_CODE_ACTIVATION_LIMIT_EXCEEDED,
  ERROR_CODE_LICENSE_EXPIRED,
  ERROR_CODE_LICENSE_NOT_FOUND,
  RESPONSE_KEY_CODE,
  RESPONSE_KEY_DATA,
  RESPONSE_KEY_ERROR,
  RESPONSE_KEY_EXPIRES_IN,
  RESPONSE_KEY_MESSAGE,
  RESPONSE_KEY_SUCCESS,
  RESPONSE_KEY_TOKEN,
} from '@/constants'
import {
  ActivationLimitExceededException,
  AuthenticationException,
  LicenseExpiredException,
  LicenseNotFoundException,
} from '@/exceptions/ApiException'
import type { HttpClientInterface } from '@/http/HttpClientInterface'

describe('Client', () => {
  let mockHttpClient: HttpClientInterface
  let client: Client

  beforeEach(() => {
    mockHttpClient = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
    } as unknown as HttpClientInterface

    client = new Client('https://api.example.com', mockHttpClient)
  })

  describe('constructor', () => {
    it('should create client with base URL', () => {
      const newClient = new Client('https://api.example.com')
      expect(newClient).toBeInstanceOf(Client)
    })

    it('should create client with custom HTTP client', () => {
      expect(client).toBeInstanceOf(Client)
    })
  })

  describe('authentication', () => {
    it('should login and set token', async () => {
      const loginResponse = {
        data: {
          [RESPONSE_KEY_SUCCESS]: true,
          [RESPONSE_KEY_DATA]: {
            [RESPONSE_KEY_TOKEN]: 'test-token',
            [RESPONSE_KEY_EXPIRES_IN]: 3600,
            user: { id: '1', username: 'test' },
          },
        },
        status: 200,
        statusText: 'OK',
        headers: {},
      }

      vi.mocked(mockHttpClient.post).mockResolvedValue(loginResponse)

      const result = await client.login('username', 'password')

      expect(result.token).toBe('test-token')
      expect(result.expires_in).toBe(3600)
      expect(client.getToken()).toBe('test-token')
    })

    it('should throw AuthenticationException on login failure', async () => {
      const errorResponse = {
        data: {
          [RESPONSE_KEY_SUCCESS]: false,
          [RESPONSE_KEY_ERROR]: {
            [RESPONSE_KEY_CODE]: 'INVALID_CREDENTIALS',
            [RESPONSE_KEY_MESSAGE]: 'Invalid credentials',
          },
        },
        status: 401,
        statusText: 'Unauthorized',
        headers: {},
      }

      vi.mocked(mockHttpClient.post).mockResolvedValue(errorResponse)

      await expect(client.login('username', 'wrong-password')).rejects.toThrow(AuthenticationException)
    })

    it('should set token directly', () => {
      client.setToken('test-token', Date.now() + 3600000)
      expect(client.getToken()).toBe('test-token')
    })

    it('should return null when no token set', () => {
      expect(client.getToken()).toBeNull()
    })
  })

  describe('public API - activateLicense', () => {
    it('should activate license successfully', async () => {
      const activateResponse = {
        data: {
          [RESPONSE_KEY_SUCCESS]: true,
          [RESPONSE_KEY_DATA]: {
            license: { id: '1', licenseKey: 'test-key' },
            activation: { id: '1', domain: 'example.com' },
          },
        },
        status: 200,
        statusText: 'OK',
        headers: {},
      }

      vi.mocked(mockHttpClient.post).mockResolvedValue(activateResponse)

      const result = await client.activateLicense('test-key', 'example.com')

      expect(result.license).toBeDefined()
      expect(result.activation).toBeDefined()
    })

    it('should throw LicenseExpiredException when license expired', async () => {
      const errorResponse = {
        data: {
          [RESPONSE_KEY_SUCCESS]: false,
          [RESPONSE_KEY_ERROR]: {
            [RESPONSE_KEY_CODE]: ERROR_CODE_LICENSE_EXPIRED,
            [RESPONSE_KEY_MESSAGE]: 'License expired',
          },
        },
        status: 400,
        statusText: 'Bad Request',
        headers: {},
      }

      vi.mocked(mockHttpClient.post).mockResolvedValue(errorResponse)

      await expect(client.activateLicense('expired-key', 'example.com')).rejects.toThrow(LicenseExpiredException)
    })

    it('should throw ActivationLimitExceededException when limit exceeded', async () => {
      const errorResponse = {
        data: {
          [RESPONSE_KEY_SUCCESS]: false,
          [RESPONSE_KEY_ERROR]: {
            [RESPONSE_KEY_CODE]: ERROR_CODE_ACTIVATION_LIMIT_EXCEEDED,
            [RESPONSE_KEY_MESSAGE]: 'Activation limit exceeded',
          },
        },
        status: 400,
        statusText: 'Bad Request',
        headers: {},
      }

      vi.mocked(mockHttpClient.post).mockResolvedValue(errorResponse)

      await expect(client.activateLicense('test-key', 'example.com')).rejects.toThrow(ActivationLimitExceededException)
    })
  })

  describe('public API - validateLicense', () => {
    it('should validate license successfully', async () => {
      const validateResponse = {
        data: {
          [RESPONSE_KEY_SUCCESS]: true,
          [RESPONSE_KEY_DATA]: {
            license: { id: '1', licenseKey: 'test-key' },
          },
        },
        status: 200,
        statusText: 'OK',
        headers: {},
      }

      vi.mocked(mockHttpClient.post).mockResolvedValue(validateResponse)

      const result = await client.validateLicense('test-key', 'example.com')

      expect(result.license).toBeDefined()
    })

    it('should throw LicenseNotFoundException when license not found', async () => {
      const errorResponse = {
        data: {
          [RESPONSE_KEY_SUCCESS]: false,
          [RESPONSE_KEY_ERROR]: {
            [RESPONSE_KEY_CODE]: ERROR_CODE_LICENSE_NOT_FOUND,
            [RESPONSE_KEY_MESSAGE]: 'License not found',
          },
        },
        status: 404,
        statusText: 'Not Found',
        headers: {},
      }

      vi.mocked(mockHttpClient.post).mockResolvedValue(errorResponse)

      await expect(client.validateLicense('invalid-key', 'example.com')).rejects.toThrow(LicenseNotFoundException)
    })
  })

  describe('public API - getLicenseData', () => {
    it('should get license data successfully', async () => {
      const licenseDataResponse = {
        data: {
          [RESPONSE_KEY_SUCCESS]: true,
          [RESPONSE_KEY_DATA]: {
            license: { id: '1', licenseKey: 'test-key' },
          },
        },
        status: 200,
        statusText: 'OK',
        headers: {},
      }

      vi.mocked(mockHttpClient.get).mockResolvedValue(licenseDataResponse)

      const result = await client.getLicenseData('test-key')

      expect(result.license).toBeDefined()
    })
  })
})
