import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Client } from '@/client'
import {
  ERROR_CODE_ACTIVATION_LIMIT_EXCEEDED,
  ERROR_CODE_LICENSE_EXPIRED,
  ERROR_CODE_LICENSE_NOT_FOUND,
  HTTP_OK,
} from '@/constants'
import {
  ActivationLimitExceededException,
  AuthenticationException,
  LicenseExpiredException,
  LicenseNotFoundException,
} from '@/exceptions/ApiException'
import type { HttpClientInterface } from '@/http/HttpClientInterface'
import { createLicense } from '../../factories/license'
import { createSuccessResponse, createErrorResponse, createHttpResponse } from '../../factories/response'
import {
  TEST_BASE_URL,
  TEST_LICENSE_KEY,
  TEST_DOMAIN,
  TEST_AUTH_TOKEN,
  TEST_AUTH_TOKEN_EXPIRES_IN,
  TEST_PRODUCT_ID,
  TEST_TENANT_ID,
  TEST_USER_ID,
  TEST_PRODUCT_SLUG,
  TEST_CUSTOMER_EMAIL,
  TEST_TIER_CODE_PROFESSIONAL,
  TEST_USERNAME,
  TEST_PASSWORD,
  TEST_HTTP_STATUS_OK,
  TEST_BOOLEAN_TRUE,
  TEST_BOOLEAN_FALSE,
  TEST_NUMBER_ZERO,
  TEST_NUMBER_ONE,
  TEST_NUMBER_TEN,
  TEST_CLIENT_VERSION,
  TEST_EMAIL,
  TEST_LICENSE_STATUS_ACTIVE,
  TEST_ADMIN_ROLE,
  TEST_TENANT_NAME,
  TEST_PRODUCT_NAME,
} from '../../constants'
import type { ApiResponse } from '@/types/api'

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

    client = new Client(TEST_BASE_URL, mockHttpClient)
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
      const loginData = {
        token: TEST_AUTH_TOKEN,
        token_type: 'Bearer',
        expires_in: TEST_AUTH_TOKEN_EXPIRES_IN,
        user: {
          id: TEST_USER_ID,
          username: TEST_USERNAME,
          email: TEST_EMAIL,
        },
      }
      const response = createHttpResponse(createSuccessResponse(loginData))

      vi.mocked(mockHttpClient.post).mockResolvedValue(response)

      const result = await client.login(TEST_USERNAME, TEST_PASSWORD)

      expect(result.token).toBe(TEST_AUTH_TOKEN)
      expect(result.expires_in).toBe(TEST_AUTH_TOKEN_EXPIRES_IN)
      expect(client.getToken()).toBe(TEST_AUTH_TOKEN)
    })

    it('should throw AuthenticationException on login failure', async () => {
      const errorResponse = createHttpResponse(
        createErrorResponse('INVALID_CREDENTIALS', 'Invalid credentials'),
        TEST_HTTP_STATUS_OK
      )

      vi.mocked(mockHttpClient.post).mockResolvedValue(errorResponse)

      await expect(client.login(TEST_USERNAME, TEST_PASSWORD)).rejects.toThrow(AuthenticationException)
    })

    it('should set token directly', () => {
      client.setToken(TEST_AUTH_TOKEN, Date.now() + TEST_AUTH_TOKEN_EXPIRES_IN * 1000)
      expect(client.getToken()).toBe(TEST_AUTH_TOKEN)
    })

    it('should return null when no token set', () => {
      expect(client.getToken()).toBeNull()
    })

    it('should clear token when expired', () => {
      client.setToken(TEST_AUTH_TOKEN, Date.now() - 1000)
      expect(client.getToken()).toBeNull()
    })
  })

  describe('public API - activateLicense', () => {
    it('should activate license successfully', async () => {
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
      const response = createHttpResponse(createSuccessResponse(activationData))

      vi.mocked(mockHttpClient.post).mockResolvedValue(response)

      const result = await client.activateLicense(TEST_LICENSE_KEY, TEST_DOMAIN)

      expect(result.license).toBeDefined()
      expect(result.activation).toBeDefined()
      expect(result.license.licenseKey).toBe(TEST_LICENSE_KEY)
    })

    it('should throw LicenseExpiredException when license expired', async () => {
      const errorResponse = createHttpResponse(
        createErrorResponse(ERROR_CODE_LICENSE_EXPIRED, 'License expired'),
        TEST_HTTP_STATUS_OK
      )

      vi.mocked(mockHttpClient.post).mockResolvedValue(errorResponse)

      await expect(client.activateLicense(TEST_LICENSE_KEY, TEST_DOMAIN)).rejects.toThrow(LicenseExpiredException)
    })

    it('should throw ActivationLimitExceededException when limit exceeded', async () => {
      const errorResponse = createHttpResponse(
        createErrorResponse(ERROR_CODE_ACTIVATION_LIMIT_EXCEEDED, 'Activation limit exceeded'),
        TEST_HTTP_STATUS_OK
      )

      vi.mocked(mockHttpClient.post).mockResolvedValue(errorResponse)

      await expect(client.activateLicense(TEST_LICENSE_KEY, TEST_DOMAIN)).rejects.toThrow(
        ActivationLimitExceededException
      )
    })
  })

  describe('public API - validateLicense', () => {
    it('should validate license successfully', async () => {
      const license = createLicense({ licenseKey: TEST_LICENSE_KEY })
      const response = createHttpResponse(createSuccessResponse({ license }))

      vi.mocked(mockHttpClient.post).mockResolvedValue(response)

      const result = await client.validateLicense(TEST_LICENSE_KEY, TEST_DOMAIN)

      expect(result.license).toBeDefined()
      expect(result.license.licenseKey).toBe(TEST_LICENSE_KEY)
    })

    it('should throw LicenseNotFoundException when license not found', async () => {
      const errorResponse = createHttpResponse(
        createErrorResponse(ERROR_CODE_LICENSE_NOT_FOUND, 'License not found'),
        TEST_HTTP_STATUS_OK
      )

      vi.mocked(mockHttpClient.post).mockResolvedValue(errorResponse)

      await expect(client.validateLicense(TEST_LICENSE_KEY, TEST_DOMAIN)).rejects.toThrow(LicenseNotFoundException)
    })
  })

  describe('public API - getLicenseData', () => {
    it('should get license data successfully', async () => {
      const license = createLicense({ licenseKey: TEST_LICENSE_KEY })
      const response = createHttpResponse(createSuccessResponse({ license }))

      vi.mocked(mockHttpClient.get).mockResolvedValue(response)

      const result = await client.getLicenseData(TEST_LICENSE_KEY)

      expect(result.license).toBeDefined()
      expect(result.license.licenseKey).toBe(TEST_LICENSE_KEY)
    })
  })

  describe('public API - deactivateLicense', () => {
    it('should deactivate license successfully', async () => {
      const response = createHttpResponse(createSuccessResponse({ success: TEST_BOOLEAN_TRUE }))

      vi.mocked(mockHttpClient.post).mockResolvedValue(response)

      const result = await client.deactivateLicense(TEST_LICENSE_KEY, TEST_DOMAIN)

      expect(result.success).toBe(TEST_BOOLEAN_TRUE)
    })
  })

  describe('public API - getLicenseFeatures', () => {
    it('should get license features successfully', async () => {
      const featuresData = {
        features: {
          feature1: 'value1',
          feature2: TEST_NUMBER_ZERO,
          feature3: TEST_BOOLEAN_TRUE,
        },
        tier: {
          id: 'tier-123',
          productId: TEST_PRODUCT_ID,
          tierCode: TEST_TIER_CODE_PROFESSIONAL,
          tierName: 'Professional',
          isActive: TEST_BOOLEAN_TRUE,
          doesNotExpire: TEST_BOOLEAN_FALSE,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      }
      const response = createHttpResponse(createSuccessResponse(featuresData))

      vi.mocked(mockHttpClient.get).mockResolvedValue(response)

      const result = await client.getLicenseFeatures(TEST_LICENSE_KEY)

      expect(result.features).toBeDefined()
      expect(result.tier).toBeDefined()
    })
  })

  describe('public API - reportUsage', () => {
    it('should report usage successfully', async () => {
      const response = createHttpResponse(createSuccessResponse({ success: TEST_BOOLEAN_TRUE }))

      vi.mocked(mockHttpClient.post).mockResolvedValue(response)

      const result = await client.reportUsage({
        license_key: TEST_LICENSE_KEY,
        domain: TEST_DOMAIN,
        month: '2024-01',
      })

      expect(result.success).toBe(TEST_BOOLEAN_TRUE)
    })
  })

  describe('public API - checkUpdate', () => {
    it('should check for updates successfully', async () => {
      const updateData = {
        update_available: TEST_BOOLEAN_FALSE,
        latest_version: TEST_CLIENT_VERSION,
      }
      const response = createHttpResponse(createSuccessResponse(updateData))

      vi.mocked(mockHttpClient.post).mockResolvedValue(response)

      const result = await client.checkUpdate({
        license_key: TEST_LICENSE_KEY,
        domain: TEST_DOMAIN,
        slug: TEST_PRODUCT_SLUG,
        current_version: TEST_CLIENT_VERSION,
      })

      expect(result.update_available).toBeDefined()
    })
  })

  describe('admin API - licenses', () => {
    it('should list licenses successfully', async () => {
      const licenses = [createLicense(), createLicense()]
      const listResponse = {
        success: TEST_BOOLEAN_TRUE,
        data: licenses,
        pagination: {
          page: TEST_NUMBER_ONE,
          limit: TEST_NUMBER_TEN,
          total: TEST_NUMBER_TEN * 2,
          totalPages: TEST_NUMBER_ONE + 1,
        },
      }
      const response = createHttpResponse(createSuccessResponse(listResponse))

      vi.mocked(mockHttpClient.get).mockResolvedValue(response)

      const result = await client.listLicenses()

      expect(result.data).toBeDefined()
      expect(result.pagination).toBeDefined()
    })

    it('should list licenses with filters', async () => {
      const licenses = [createLicense()]
      const listResponse = {
        success: TEST_BOOLEAN_TRUE,
        data: licenses,
        pagination: {
          page: TEST_NUMBER_ONE,
          limit: TEST_NUMBER_TEN,
          total: TEST_NUMBER_ONE,
          totalPages: TEST_NUMBER_ONE,
        },
      }
      const response = createHttpResponse(createSuccessResponse(listResponse))

      vi.mocked(mockHttpClient.get).mockResolvedValue(response)

      const result = await client.listLicenses({
        status: TEST_LICENSE_STATUS_ACTIVE,
        product_slug: TEST_PRODUCT_SLUG,
      })

      expect(result.data).toBeDefined()
    })

    it('should create license successfully', async () => {
      const license = createLicense()
      const response = createHttpResponse(createSuccessResponse({ license }))

      vi.mocked(mockHttpClient.post).mockResolvedValue(response)

      const result = await client.createLicense({
        customer_email: TEST_CUSTOMER_EMAIL,
        product_slug: TEST_PRODUCT_SLUG,
        tier_code: TEST_TIER_CODE_PROFESSIONAL,
      })

      expect(result.license).toBeDefined()
    })

    it('should get license successfully', async () => {
      const license = createLicense({ licenseKey: TEST_LICENSE_KEY })
      const response = createHttpResponse(createSuccessResponse({ license }))

      vi.mocked(mockHttpClient.get).mockResolvedValue(response)

      const result = await client.getLicense(TEST_LICENSE_KEY)

      expect(result.license).toBeDefined()
    })

    it('should update license successfully', async () => {
      const license = createLicense()
      const response = createHttpResponse(createSuccessResponse({ license }))

      vi.mocked(mockHttpClient.put).mockResolvedValue(response)

      const result = await client.updateLicense(TEST_LICENSE_KEY, {
        tier_code: TEST_TIER_CODE_PROFESSIONAL,
      })

      expect(result.license).toBeDefined()
    })

    it('should suspend license successfully', async () => {
      const response = createHttpResponse(createSuccessResponse({ success: TEST_BOOLEAN_TRUE }))

      vi.mocked(mockHttpClient.post).mockResolvedValue(response)

      const result = await client.suspendLicense(TEST_LICENSE_KEY)

      expect(result.success).toBe(TEST_BOOLEAN_TRUE)
    })

    it('should resume license successfully', async () => {
      const response = createHttpResponse(createSuccessResponse({ success: TEST_BOOLEAN_TRUE }))

      vi.mocked(mockHttpClient.post).mockResolvedValue(response)

      const result = await client.resumeLicense(TEST_LICENSE_KEY)

      expect(result.success).toBe(TEST_BOOLEAN_TRUE)
    })

    it('should freeze license successfully', async () => {
      const license = createLicense()
      const response = createHttpResponse(createSuccessResponse({ license }))

      vi.mocked(mockHttpClient.post).mockResolvedValue(response)

      const result = await client.freezeLicense(TEST_LICENSE_KEY)

      expect(result.license).toBeDefined()
    })

    it('should revoke license successfully', async () => {
      const response = createHttpResponse(createSuccessResponse({ success: TEST_BOOLEAN_TRUE }))

      vi.mocked(mockHttpClient.delete).mockResolvedValue(response)

      const result = await client.revokeLicense(TEST_LICENSE_KEY)

      expect(result.success).toBe(TEST_BOOLEAN_TRUE)
    })

    it('should get license activations successfully', async () => {
      const activations = [
        {
          id: 'activation-1',
          licenseKey: TEST_LICENSE_KEY,
          domain: TEST_DOMAIN,
          status: 'ACTIVE' as const,
          activatedAt: new Date().toISOString(),
        },
      ]
      const response = createHttpResponse(createSuccessResponse({ activations }))

      vi.mocked(mockHttpClient.get).mockResolvedValue(response)

      const result = await client.getLicenseActivations(TEST_LICENSE_KEY)

      expect(result.activations).toBeDefined()
    })
  })

  describe('admin API - products', () => {
    it('should list products successfully', async () => {
      const products = [
        {
          id: TEST_PRODUCT_ID,
          slug: TEST_PRODUCT_SLUG,
          name: TEST_PRODUCT_NAME,
          isActive: TEST_BOOLEAN_TRUE,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]
      const listResponse = {
        success: TEST_BOOLEAN_TRUE,
        data: products,
        pagination: {
          page: TEST_NUMBER_ONE,
          limit: TEST_NUMBER_TEN,
          total: TEST_NUMBER_ONE,
          totalPages: TEST_NUMBER_ONE,
        },
      }
      const response = createHttpResponse(createSuccessResponse(listResponse))

      vi.mocked(mockHttpClient.get).mockResolvedValue(response)

      const result = await client.listProducts()

      expect(result.data).toBeDefined()
    })

    it('should create product successfully', async () => {
      const product = {
        id: TEST_PRODUCT_ID,
        slug: TEST_PRODUCT_SLUG,
        name: TEST_PRODUCT_NAME,
        isActive: TEST_BOOLEAN_TRUE,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      const response = createHttpResponse(createSuccessResponse({ product }))

      vi.mocked(mockHttpClient.post).mockResolvedValue(response)

      const result = await client.createProduct({
        name: TEST_PRODUCT_NAME,
        slug: TEST_PRODUCT_SLUG,
      })

      expect(result.product).toBeDefined()
    })

    it('should get product successfully', async () => {
      const product = {
        id: TEST_PRODUCT_ID,
        slug: TEST_PRODUCT_SLUG,
        name: TEST_PRODUCT_NAME,
        isActive: TEST_BOOLEAN_TRUE,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      const response = createHttpResponse(createSuccessResponse({ product }))

      vi.mocked(mockHttpClient.get).mockResolvedValue(response)

      const result = await client.getProduct(TEST_PRODUCT_ID)

      expect(result.product).toBeDefined()
    })

    it('should update product successfully', async () => {
      const product = {
        id: TEST_PRODUCT_ID,
        slug: TEST_PRODUCT_SLUG,
        name: TEST_PRODUCT_NAME,
        isActive: TEST_BOOLEAN_TRUE,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      const response = createHttpResponse(createSuccessResponse({ product }))

      vi.mocked(mockHttpClient.put).mockResolvedValue(response)

      const result = await client.updateProduct(TEST_PRODUCT_ID, { name: TEST_PRODUCT_NAME })

      expect(result.product).toBeDefined()
    })

    it('should delete product successfully', async () => {
      const response = createHttpResponse(createSuccessResponse({ success: TEST_BOOLEAN_TRUE }))

      vi.mocked(mockHttpClient.delete).mockResolvedValue(response)

      const result = await client.deleteProduct(TEST_PRODUCT_ID)

      expect(result.success).toBe(TEST_BOOLEAN_TRUE)
    })

    it('should suspend product successfully', async () => {
      const response = createHttpResponse(createSuccessResponse({ success: TEST_BOOLEAN_TRUE }))

      vi.mocked(mockHttpClient.post).mockResolvedValue(response)

      const result = await client.suspendProduct(TEST_PRODUCT_ID)

      expect(result.success).toBe(TEST_BOOLEAN_TRUE)
    })

    it('should resume product successfully', async () => {
      const response = createHttpResponse(createSuccessResponse({ success: TEST_BOOLEAN_TRUE }))

      vi.mocked(mockHttpClient.post).mockResolvedValue(response)

      const result = await client.resumeProduct(TEST_PRODUCT_ID)

      expect(result.success).toBe(TEST_BOOLEAN_TRUE)
    })
  })

  describe('admin API - product tiers', () => {
    it('should list product tiers successfully', async () => {
      const tiers = [
        {
          id: 'tier-123',
          productId: TEST_PRODUCT_ID,
          tierCode: TEST_TIER_CODE_PROFESSIONAL,
          tierName: 'Professional',
          isActive: TEST_BOOLEAN_TRUE,
          doesNotExpire: TEST_BOOLEAN_FALSE,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]
      const response = createHttpResponse(
        createSuccessResponse({
          data: tiers,
          pagination: {
            page: TEST_NUMBER_ONE,
            limit: TEST_NUMBER_TEN,
            total: TEST_NUMBER_ONE,
            totalPages: TEST_NUMBER_ONE,
          },
        })
      )

      vi.mocked(mockHttpClient.get).mockResolvedValue(response)

      const result = await client.listProductTiers(TEST_PRODUCT_ID)

      expect(result.data).toBeDefined()
    })

    it('should create product tier successfully', async () => {
      const tier = {
        id: 'tier-123',
        productId: TEST_PRODUCT_ID,
        tierCode: TEST_TIER_CODE_PROFESSIONAL,
        tierName: 'Professional',
        isActive: TEST_BOOLEAN_TRUE,
        doesNotExpire: TEST_BOOLEAN_FALSE,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      const response = createHttpResponse(createSuccessResponse({ tier }))

      vi.mocked(mockHttpClient.post).mockResolvedValue(response)

      const result = await client.createProductTier(TEST_PRODUCT_ID, {
        name: 'Professional',
        code: TEST_TIER_CODE_PROFESSIONAL,
      })

      expect(result.tier).toBeDefined()
    })

    it('should get product tier successfully', async () => {
      const tier = {
        id: 'tier-123',
        productId: TEST_PRODUCT_ID,
        tierCode: TEST_TIER_CODE_PROFESSIONAL,
        tierName: 'Professional',
        isActive: TEST_BOOLEAN_TRUE,
        doesNotExpire: TEST_BOOLEAN_FALSE,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      const response = createHttpResponse(createSuccessResponse({ tier }))

      vi.mocked(mockHttpClient.get).mockResolvedValue(response)

      const result = await client.getProductTier('tier-123')

      expect(result.tier).toBeDefined()
    })

    it('should update product tier successfully', async () => {
      const tier = {
        id: 'tier-123',
        productId: TEST_PRODUCT_ID,
        tierCode: TEST_TIER_CODE_PROFESSIONAL,
        tierName: 'Professional',
        isActive: TEST_BOOLEAN_TRUE,
        doesNotExpire: TEST_BOOLEAN_FALSE,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      const response = createHttpResponse(createSuccessResponse({ tier }))

      vi.mocked(mockHttpClient.put).mockResolvedValue(response)

      const result = await client.updateProductTier('tier-123', { name: 'Professional' })

      expect(result.tier).toBeDefined()
    })

    it('should delete product tier successfully', async () => {
      const response = createHttpResponse(createSuccessResponse({ success: TEST_BOOLEAN_TRUE }))

      vi.mocked(mockHttpClient.delete).mockResolvedValue(response)

      const result = await client.deleteProductTier('tier-123')

      expect(result.success).toBe(TEST_BOOLEAN_TRUE)
    })
  })

  describe('admin API - entitlements', () => {
    it('should list entitlements successfully', async () => {
      const entitlements = [
        {
          id: 'entitlement-123',
          productId: TEST_PRODUCT_ID,
          key: 'feature-key',
          value_type: 'boolean' as const,
          default_value: TEST_BOOLEAN_TRUE,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]
      const response = createHttpResponse(
        createSuccessResponse({
          data: entitlements,
          pagination: {
            page: TEST_NUMBER_ONE,
            limit: TEST_NUMBER_TEN,
            total: TEST_NUMBER_ONE,
            totalPages: TEST_NUMBER_ONE,
          },
        })
      )

      vi.mocked(mockHttpClient.get).mockResolvedValue(response)

      const result = await client.listEntitlements(TEST_PRODUCT_ID)

      expect(result.data).toBeDefined()
    })

    it('should create entitlement successfully', async () => {
      const entitlement = {
        id: 'entitlement-123',
        productId: TEST_PRODUCT_ID,
        key: 'feature-key',
        value_type: 'boolean' as const,
        default_value: TEST_BOOLEAN_TRUE,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      const response = createHttpResponse(createSuccessResponse({ entitlement }))

      vi.mocked(mockHttpClient.post).mockResolvedValue(response)

      const result = await client.createEntitlement(TEST_PRODUCT_ID, {
        key: 'feature-key',
        value_type: 'boolean',
        default_value: TEST_BOOLEAN_TRUE,
      })

      expect(result.entitlement).toBeDefined()
    })

    it('should get entitlement successfully', async () => {
      const entitlement = {
        id: 'entitlement-123',
        productId: TEST_PRODUCT_ID,
        key: 'feature-key',
        value_type: 'boolean' as const,
        default_value: TEST_BOOLEAN_TRUE,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      const response = createHttpResponse(createSuccessResponse({ entitlement }))

      vi.mocked(mockHttpClient.get).mockResolvedValue(response)

      const result = await client.getEntitlement('entitlement-123')

      expect(result.entitlement).toBeDefined()
    })

    it('should update entitlement successfully', async () => {
      const entitlement = {
        id: 'entitlement-123',
        productId: TEST_PRODUCT_ID,
        key: 'feature-key',
        value_type: 'boolean' as const,
        default_value: TEST_BOOLEAN_TRUE,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      const response = createHttpResponse(createSuccessResponse({ entitlement }))

      vi.mocked(mockHttpClient.put).mockResolvedValue(response)

      const result = await client.updateEntitlement('entitlement-123', {
        default_value: TEST_BOOLEAN_FALSE,
      })

      expect(result.entitlement).toBeDefined()
    })

    it('should delete entitlement successfully', async () => {
      const response = createHttpResponse(createSuccessResponse({ success: TEST_BOOLEAN_TRUE }))

      vi.mocked(mockHttpClient.delete).mockResolvedValue(response)

      const result = await client.deleteEntitlement('entitlement-123')

      expect(result.success).toBe(TEST_BOOLEAN_TRUE)
    })
  })

  describe('admin API - users', () => {
    it('should list users successfully', async () => {
      const users = [
        {
          id: TEST_USER_ID,
          username: TEST_USERNAME,
          email: TEST_EMAIL,
          role: TEST_ADMIN_ROLE,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]
      const response = createHttpResponse(
        createSuccessResponse({
          data: users,
          pagination: {
            page: TEST_NUMBER_ONE,
            limit: TEST_NUMBER_TEN,
            total: TEST_NUMBER_ONE,
            totalPages: TEST_NUMBER_ONE,
          },
        })
      )

      vi.mocked(mockHttpClient.get).mockResolvedValue(response)

      const result = await client.listUsers()

      expect(result.data).toBeDefined()
    })

    it('should create user successfully', async () => {
      const user = {
        id: TEST_USER_ID,
        username: TEST_USERNAME,
        email: TEST_EMAIL,
        role: TEST_ADMIN_ROLE,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      const response = createHttpResponse(createSuccessResponse({ user }))

      vi.mocked(mockHttpClient.post).mockResolvedValue(response)

      const result = await client.createUser({
        username: TEST_USERNAME,
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      })

      expect(result.user).toBeDefined()
    })

    it('should get user successfully', async () => {
      const user = {
        id: TEST_USER_ID,
        username: TEST_USERNAME,
        email: TEST_EMAIL,
        role: TEST_ADMIN_ROLE,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      const response = createHttpResponse(createSuccessResponse({ user }))

      vi.mocked(mockHttpClient.get).mockResolvedValue(response)

      const result = await client.getUser(TEST_USER_ID)

      expect(result.user).toBeDefined()
    })

    it('should update user successfully', async () => {
      const user = {
        id: TEST_USER_ID,
        username: TEST_USERNAME,
        email: TEST_EMAIL,
        role: TEST_ADMIN_ROLE,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      const response = createHttpResponse(createSuccessResponse({ user }))

      vi.mocked(mockHttpClient.put).mockResolvedValue(response)

      const result = await client.updateUser(TEST_USER_ID, { email: TEST_EMAIL })

      expect(result.user).toBeDefined()
    })

    it('should delete user successfully', async () => {
      const response = createHttpResponse(createSuccessResponse({ success: TEST_BOOLEAN_TRUE }))

      vi.mocked(mockHttpClient.delete).mockResolvedValue(response)

      const result = await client.deleteUser(TEST_USER_ID)

      expect(result.success).toBe(TEST_BOOLEAN_TRUE)
    })

    it('should get current user successfully', async () => {
      const user = {
        id: TEST_USER_ID,
        username: TEST_USERNAME,
        email: TEST_EMAIL,
        role: TEST_ADMIN_ROLE,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      const response = createHttpResponse(createSuccessResponse({ user }))

      vi.mocked(mockHttpClient.get).mockResolvedValue(response)

      const result = await client.getCurrentUser()

      expect(result.user).toBeDefined()
    })

    it('should change password successfully', async () => {
      const response = createHttpResponse(createSuccessResponse({ success: TEST_BOOLEAN_TRUE }))

      vi.mocked(mockHttpClient.patch).mockResolvedValue(response)

      const result = await client.changePassword({
        current_password: TEST_PASSWORD,
        new_password: TEST_PASSWORD,
      })

      expect(result.success).toBe(TEST_BOOLEAN_TRUE)
    })
  })

  describe('admin API - tenants', () => {
    it('should list tenants successfully', async () => {
      const tenants = [
        {
          id: TEST_TENANT_ID,
          name: TEST_TENANT_NAME,
          status: 'ACTIVE' as const,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]
      const response = createHttpResponse(
        createSuccessResponse({
          data: tenants,
          pagination: {
            page: TEST_NUMBER_ONE,
            limit: TEST_NUMBER_TEN,
            total: TEST_NUMBER_ONE,
            totalPages: TEST_NUMBER_ONE,
          },
        })
      )

      vi.mocked(mockHttpClient.get).mockResolvedValue(response)

      const result = await client.listTenants()

      expect(result.data).toBeDefined()
    })

    it('should create tenant successfully', async () => {
      const tenant = {
        id: TEST_TENANT_ID,
        name: TEST_TENANT_NAME,
        status: 'ACTIVE' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      const response = createHttpResponse(createSuccessResponse({ tenant }))

      vi.mocked(mockHttpClient.post).mockResolvedValue(response)

      const result = await client.createTenant({ name: TEST_TENANT_NAME })

      expect(result.tenant).toBeDefined()
    })

    it('should update tenant successfully', async () => {
      const tenant = {
        id: TEST_TENANT_ID,
        name: TEST_TENANT_NAME,
        status: 'ACTIVE' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      const response = createHttpResponse(createSuccessResponse({ tenant }))

      vi.mocked(mockHttpClient.put).mockResolvedValue(response)

      const result = await client.updateTenant(TEST_TENANT_ID, { name: TEST_TENANT_NAME })

      expect(result.tenant).toBeDefined()
    })

    it('should suspend tenant successfully', async () => {
      const response = createHttpResponse(createSuccessResponse({ success: TEST_BOOLEAN_TRUE }))

      vi.mocked(mockHttpClient.post).mockResolvedValue(response)

      const result = await client.suspendTenant(TEST_TENANT_ID)

      expect(result.success).toBe(TEST_BOOLEAN_TRUE)
    })

    it('should resume tenant successfully', async () => {
      const response = createHttpResponse(createSuccessResponse({ success: TEST_BOOLEAN_TRUE }))

      vi.mocked(mockHttpClient.post).mockResolvedValue(response)

      const result = await client.resumeTenant(TEST_TENANT_ID)

      expect(result.success).toBe(TEST_BOOLEAN_TRUE)
    })

    it('should get quota usage successfully', async () => {
      const quotaUsage = {
        usage: {
          products_count: TEST_NUMBER_ONE,
          activations_count: TEST_NUMBER_TEN,
        },
      }
      const response = createHttpResponse(createSuccessResponse(quotaUsage))

      vi.mocked(mockHttpClient.get).mockResolvedValue(response)

      const result = await client.getQuotaUsage(TEST_TENANT_ID)

      expect(result.usage).toBeDefined()
    })

    it('should get quota config successfully', async () => {
      const quotaConfig = {
        config: {
          max_products: TEST_NUMBER_TEN,
        },
      }
      const response = createHttpResponse(createSuccessResponse(quotaConfig))

      vi.mocked(mockHttpClient.get).mockResolvedValue(response)

      const result = await client.getQuotaConfig(TEST_TENANT_ID)

      expect(result.config).toBeDefined()
    })

    it('should update quota limits successfully', async () => {
      const response = createHttpResponse(createSuccessResponse({ success: TEST_BOOLEAN_TRUE }))

      vi.mocked(mockHttpClient.put).mockResolvedValue(response)

      const result = await client.updateQuotaLimits(TEST_TENANT_ID, {
        max_products: TEST_NUMBER_TEN,
      })

      expect(result.success).toBe(TEST_BOOLEAN_TRUE)
    })
  })

  describe('admin API - analytics', () => {
    it('should get system stats successfully', async () => {
      const stats = {
        stats: {
          active_licenses: TEST_NUMBER_TEN,
          expired_licenses: TEST_NUMBER_ZERO,
          total_customers: TEST_NUMBER_TEN,
          total_activations: TEST_NUMBER_TEN,
        },
      }
      const response = createHttpResponse(createSuccessResponse(stats))

      vi.mocked(mockHttpClient.get).mockResolvedValue(response)

      const result = await client.getSystemStats()

      expect(result.stats).toBeDefined()
    })

    it('should get usage summaries successfully', async () => {
      const summaries = {
        summaries: [
          {
            id: TEST_NUMBER_ONE,
            tenantId: null,
            licenseId: TEST_NUMBER_ONE,
            periodStart: new Date().toISOString(),
            periodEnd: new Date().toISOString(),
            totalActivations: TEST_NUMBER_ONE,
            totalValidations: TEST_NUMBER_ONE,
            totalUsageReports: TEST_NUMBER_ONE,
            uniqueDomains: TEST_NUMBER_ONE,
            uniqueIPs: TEST_NUMBER_ONE,
            peakConcurrency: TEST_NUMBER_ONE,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
      }
      const response = createHttpResponse(createSuccessResponse(summaries))

      vi.mocked(mockHttpClient.get).mockResolvedValue(response)

      const result = await client.getUsageSummaries()

      expect(result.summaries).toBeDefined()
    })

    it('should get usage trends successfully', async () => {
      const trends = {
        periodStart: new Date().toISOString(),
        periodEnd: new Date().toISOString(),
        groupBy: 'day',
        trends: [
          {
            period: new Date().toISOString(),
            totalActivations: TEST_NUMBER_ONE,
            totalValidations: TEST_NUMBER_ONE,
            totalUsageReports: TEST_NUMBER_ONE,
            uniqueDomains: TEST_NUMBER_ONE,
            uniqueIPs: TEST_NUMBER_ONE,
            peakConcurrency: TEST_NUMBER_ONE,
          },
        ],
      }
      const response = createHttpResponse(createSuccessResponse(trends))

      vi.mocked(mockHttpClient.get).mockResolvedValue(response)

      const result = await client.getUsageTrends()

      expect(result.trends).toBeDefined()
    })
  })
})
