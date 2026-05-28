import { QueryClient } from '@tanstack/react-query';

/**
 * Hardened React Query defaults:
 * - 60s stale time → cut redundant refetches on page nav
 * - 5min cache GC → fast back-button experience
 * - 2 retries with exponential backoff → resilient to flaky networks
 * - No refetch on window focus (disruptive for a marketing site)
 */
export const queryClientInstance = new QueryClient({
	defaultOptions: {
		queries: {
			refetchOnWindowFocus: false,
			retry: 2,
			retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
			staleTime: 60 * 1000,
			gcTime: 5 * 60 * 1000,
		},
		mutations: {
			retry: 1,
		},
	},
});
