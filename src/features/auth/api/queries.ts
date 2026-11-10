import { queryOptions } from '@tanstack/react-query';
import { getCurrentUser } from './service';

export const authKeys = {
  user: ['auth', 'user'] as const
};

/**
 * The current user, cached so the root beforeLoad doesn't call the server on every navigation.
 * Sign in and out update this entry directly, and so does a 401 from any server function.
 */
export const currentUserQueryOptions = () =>
  queryOptions({
    queryKey: authKeys.user,
    queryFn: () => getCurrentUser(),
    staleTime: Infinity
  });
