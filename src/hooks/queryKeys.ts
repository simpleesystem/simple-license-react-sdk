/**
 * Query key factories for React Query
 * Centralized query key management for cache invalidation
 */

export const QUERY_KEYS = {
  // Authentication
  auth: {
    currentUser: () => ['auth', 'currentUser'] as const,
    token: () => ['auth', 'token'] as const,
  },

  // Public API - Licenses
  licenses: {
    all: () => ['licenses'] as const,
    detail: (key: string) => ['licenses', key] as const,
    features: (key: string) => ['licenses', key, 'features'] as const,
    data: (key: string) => ['licenses', key, 'data'] as const,
  },

  // Admin API - Licenses
  adminLicenses: {
    all: (filters?: Record<string, string | number | boolean | null | undefined>) =>
      ['admin', 'licenses', filters] as const,
    detail: (id: string) => ['admin', 'licenses', id] as const,
    activations: (id: string) => ['admin', 'licenses', id, 'activations'] as const,
  },

  // Admin API - Products
  adminProducts: {
    all: () => ['admin', 'products'] as const,
    detail: (id: string) => ['admin', 'products', id] as const,
  },

  // Admin API - Product Tiers
  adminProductTiers: {
    all: (productId: string) => ['admin', 'products', productId, 'tiers'] as const,
    detail: (id: string) => ['admin', 'product-tiers', id] as const,
  },

  // Admin API - Entitlements
  adminEntitlements: {
    all: (productId: string) => ['admin', 'products', productId, 'entitlements'] as const,
    detail: (id: string) => ['admin', 'entitlements', id] as const,
  },

  // Admin API - Users
  adminUsers: {
    all: () => ['admin', 'users'] as const,
    detail: (id: string) => ['admin', 'users', id] as const,
    current: () => ['admin', 'users', 'me'] as const,
  },

  // Admin API - Tenants
  adminTenants: {
    all: () => ['admin', 'tenants'] as const,
    detail: (id: string) => ['admin', 'tenants', id] as const,
    quotaUsage: (id: string) => ['admin', 'tenants', id, 'quota', 'usage'] as const,
    quotaConfig: (id: string) => ['admin', 'tenants', id, 'quota', 'config'] as const,
  },

  // Admin API - Analytics
  adminAnalytics: {
    stats: () => ['admin', 'analytics', 'stats'] as const,
    usage: () => ['admin', 'analytics', 'usage'] as const,
    trends: () => ['admin', 'analytics', 'trends'] as const,
  },
} as const
