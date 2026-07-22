import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,      // 5 min — data stays fresh
      gcTime: 10 * 60 * 1000,         // 10 min — cache kept in memory
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});
