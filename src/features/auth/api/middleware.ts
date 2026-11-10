import { createMiddleware } from '@tanstack/react-start';
import { setResponseStatus } from '@tanstack/react-start/server';
import { SIGNED_OUT_MESSAGE } from '../utils';
import { readCurrentUser } from './current-user.server';

/**
 * Server function middleware that rejects signed-out callers and passes the
 * user to the handler as `context.user`. Route guards only control navigation;
 * every server function that touches private data needs this as well.
 */
export const authMiddleware = createMiddleware({ type: 'function' }).server(async ({ next }) => {
  const user = await readCurrentUser();
  if (!user) {
    setResponseStatus(401);
    throw new Error(SIGNED_OUT_MESSAGE);
  }
  return next({ context: { user } });
});
