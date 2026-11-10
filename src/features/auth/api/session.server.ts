import { getIronSession } from 'iron-session';
import { getCookie, getCookies, setCookie } from '@tanstack/react-start/server';
import type { SessionUser } from './types';

type SessionData = {
  user?: SessionUser;
};

const SESSION_HOURS = 12;

// Only for `vite dev`. Production requires a real SESSION_SECRET.
const DEV_SESSION_SECRET = 'dev-only-session-secret-do-not-use-in-production';

/**
 * Encrypted, httpOnly cookie session (iron-session over Start's cookie helpers),
 * the same approach as TanStack's `start-basic-auth` example. Server-only: call
 * it from server functions, server routes or middleware.
 */
export function getAppSession() {
  const password = process.env.SESSION_SECRET ?? (import.meta.env.DEV ? DEV_SESSION_SECRET : '');
  if (password.length < 32) {
    throw new Error('Set SESSION_SECRET to at least 32 characters (openssl rand -base64 32).');
  }

  return getIronSession<SessionData>(
    { read: getCookie, write: setCookie, names: () => Object.keys(getCookies()) },
    {
      cookieName: 'provisioning_console_session',
      password,
      ttl: SESSION_HOURS * 60 * 60,
      cookieOptions: {
        httpOnly: true,
        sameSite: 'lax',
        secure: import.meta.env.PROD,
        path: '/'
      }
    }
  );
}
