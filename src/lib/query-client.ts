import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Don't refetch on window focus in desktop app
      refetchOnWindowFocus: false,
      // Retry failed requests 1 time
      retry: 1,
      // Cache data for 5 minutes
      staleTime: 1000 * 60 * 5,
      // Keep data in cache for 10 minutes
      gcTime: 1000 * 60 * 10,
    },
    mutations: {
      // Retry failed mutations 1 time
      retry: 1,
    },
  },
})
