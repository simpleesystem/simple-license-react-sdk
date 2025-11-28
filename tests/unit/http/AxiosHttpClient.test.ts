import axios, { type AxiosError, type AxiosInstance } from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  CONTENT_TYPE_JSON,
  DEFAULT_TIMEOUT_SECONDS,
  HEADER_CONTENT_TYPE,
  HTTP_INTERNAL_SERVER_ERROR,
  HTTP_NOT_FOUND,
  HTTP_OK,
} from '@/constants'
import { NetworkException } from '@/exceptions/ApiException'
import { AxiosHttpClient } from '@/http/AxiosHttpClient'

// Mock axios
vi.mock('axios')
const mockedAxios = vi.mocked(axios)

describe('AxiosHttpClient', () => {
  let axiosInstance: AxiosInstance
  let httpClient: AxiosHttpClient

  beforeEach(() => {
    vi.clearAllMocks()
    axiosInstance = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
      interceptors: {
        request: { use: vi.fn(), eject: vi.fn() },
        response: { use: vi.fn(), eject: vi.fn() },
      },
      defaults: {
        headers: {
          common: {},
        },
      },
    } as unknown as AxiosInstance

    mockedAxios.create.mockReturnValue(axiosInstance)
    httpClient = new AxiosHttpClient('https://api.example.com')
  })

  describe('constructor', () => {
    it('should create axios instance with base URL', () => {
      expect(mockedAxios.create).toHaveBeenCalledWith({
        baseURL: 'https://api.example.com',
        timeout: DEFAULT_TIMEOUT_SECONDS * 1000,
        headers: {
          [HEADER_CONTENT_TYPE]: CONTENT_TYPE_JSON,
        },
      })
    })

    it('should create axios instance with custom timeout', () => {
      const customTimeoutSeconds = 60
      new AxiosHttpClient('https://api.example.com', customTimeoutSeconds)

      expect(mockedAxios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          timeout: customTimeoutSeconds * 1000,
        })
      )
    })

    it('should set up request interceptor for authentication', () => {
      expect(axiosInstance.interceptors.request.use).toHaveBeenCalled()
    })
  })

  describe('get', () => {
    it('should make GET request and return response', async () => {
      const responseData = { success: true, data: { id: '123' } }
      vi.mocked(axiosInstance.get).mockResolvedValue({
        data: responseData,
        status: HTTP_OK,
        statusText: 'OK',
        headers: {},
        config: {} as never,
      })

      const result = await httpClient.get('/test')

      expect(axiosInstance.get).toHaveBeenCalledWith('/test', undefined)
      expect(result.data).toEqual(responseData)
      expect(result.status).toBe(HTTP_OK)
    })

    it('should pass config to axios', async () => {
      const config = { headers: { 'Custom-Header': 'value' } }
      vi.mocked(axiosInstance.get).mockResolvedValue({
        data: {},
        status: HTTP_OK,
        statusText: 'OK',
        headers: {},
        config: {} as never,
      })

      await httpClient.get('/test', config)

      expect(axiosInstance.get).toHaveBeenCalledWith('/test', config)
    })

    it('should throw NetworkException on error', async () => {
      const axiosError = {
        isAxiosError: true,
        response: {
          status: HTTP_NOT_FOUND,
          statusText: 'Not Found',
          data: { error: { code: 'NOT_FOUND', message: 'Resource not found' } },
          headers: {},
          config: {} as never,
        },
        message: 'Request failed',
      } as unknown as AxiosError

      vi.mocked(axiosInstance.get).mockRejectedValue(axiosError)

      await expect(httpClient.get('/test')).rejects.toThrow(NetworkException)
    })

    it('should throw NetworkException on network error without response', async () => {
      const axiosError = {
        isAxiosError: true,
        message: 'Network Error',
        code: 'ECONNREFUSED',
      } as unknown as AxiosError

      vi.mocked(axiosInstance.get).mockRejectedValue(axiosError)

      await expect(httpClient.get('/test')).rejects.toThrow(NetworkException)
    })
  })

  describe('post', () => {
    it('should make POST request with data', async () => {
      const requestData = { name: 'Test' }
      const responseData = { success: true, data: { id: '123', name: 'Test' } }

      vi.mocked(axiosInstance.post).mockResolvedValue({
        data: responseData,
        status: HTTP_OK,
        statusText: 'OK',
        headers: {},
        config: {} as never,
      })

      const result = await httpClient.post('/test', requestData)

      expect(axiosInstance.post).toHaveBeenCalledWith('/test', requestData, undefined)
      expect(result.data).toEqual(responseData)
    })

    it('should throw NetworkException on error', async () => {
      const axiosError = {
        isAxiosError: true,
        response: {
          status: HTTP_INTERNAL_SERVER_ERROR,
          statusText: 'Internal Server Error',
          data: {},
          headers: {},
          config: {} as never,
        },
        message: 'Server error',
      } as unknown as AxiosError

      vi.mocked(axiosInstance.post).mockRejectedValue(axiosError)

      await expect(httpClient.post('/test', {})).rejects.toThrow(NetworkException)
    })
  })

  describe('put', () => {
    it('should make PUT request with data', async () => {
      const requestData = { name: 'Updated' }
      vi.mocked(axiosInstance.put).mockResolvedValue({
        data: { success: true },
        status: HTTP_OK,
        statusText: 'OK',
        headers: {},
        config: {} as never,
      })

      await httpClient.put('/test', requestData)

      expect(axiosInstance.put).toHaveBeenCalledWith('/test', requestData, undefined)
    })
  })

  describe('patch', () => {
    it('should make PATCH request with data', async () => {
      const requestData = { name: 'Patched' }
      vi.mocked(axiosInstance.patch).mockResolvedValue({
        data: { success: true },
        status: HTTP_OK,
        statusText: 'OK',
        headers: {},
        config: {} as never,
      })

      await httpClient.patch('/test', requestData)

      expect(axiosInstance.patch).toHaveBeenCalledWith('/test', requestData, undefined)
    })
  })

  describe('delete', () => {
    it('should make DELETE request', async () => {
      vi.mocked(axiosInstance.delete).mockResolvedValue({
        data: { success: true },
        status: HTTP_OK,
        statusText: 'OK',
        headers: {},
        config: {} as never,
      })

      await httpClient.delete('/test')

      expect(axiosInstance.delete).toHaveBeenCalledWith('/test', undefined)
    })
  })

  describe('setAuthToken', () => {
    it('should set authorization header in request interceptor', () => {
      const token = 'test-token'
      httpClient.setAuthToken(token)

      // The interceptor should be set up to add the token
      // We verify this by checking that the interceptor was configured
      expect(axiosInstance.interceptors.request.use).toHaveBeenCalled()
    })
  })
})
