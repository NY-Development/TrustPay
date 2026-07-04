import { QueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/src/store/authStore';

let queryClientRef: QueryClient | null = null;

export function setQueryClient(client: QueryClient) {
  queryClientRef = client;
}

/**
 * Clears ALL cached data on logout
 */
export function clearAuthCache() {
  queryClientRef?.clear();
}

/**
 * Prefetch user data after login
 */
export async function hydrateAuthCache() {
  const user = useAuthStore.getState().user;

  if (!user) return;

  // Example: prefetch current user-related queries
  queryClientRef?.invalidateQueries({
    queryKey: ['me'],
  });
}