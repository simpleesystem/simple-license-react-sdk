/**
 * React Query hooks for admin analytics
 */
import { type UseQueryOptions, useQuery } from '@tanstack/react-query'
import type { Client } from '../client'
import type { SystemStatsResponse, UsageSummaryResponse, UsageTrendsResponse } from '../types/api'
import { QUERY_KEYS } from './queryKeys'

export function useSystemStats(
  client: Client,
  options?: Omit<UseQueryOptions<SystemStatsResponse, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery<SystemStatsResponse, Error>({
    queryKey: QUERY_KEYS.adminAnalytics.stats(),
    queryFn: async () => {
      return await client.getSystemStats()
    },
    ...options,
  })
}

export function useUsageSummaries(
  client: Client,
  options?: Omit<UseQueryOptions<UsageSummaryResponse, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery<UsageSummaryResponse, Error>({
    queryKey: QUERY_KEYS.adminAnalytics.usage(),
    queryFn: async () => {
      return await client.getUsageSummaries()
    },
    ...options,
  })
}

export function useUsageTrends(
  client: Client,
  options?: Omit<UseQueryOptions<UsageTrendsResponse, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery<UsageTrendsResponse, Error>({
    queryKey: QUERY_KEYS.adminAnalytics.trends(),
    queryFn: async () => {
      return await client.getUsageTrends()
    },
    ...options,
  })
}
