import { createServerFn } from '@tanstack/react-start';
import * as z from 'zod';
import { API_ERROR_COPY, apiErrorCode } from '@/features/provisioning/api/errors';
import { verifyCredentials } from './accounts.server';
import { readCurrentUser } from './current-user.server';
import { LOCK_MINUTES, clearFailures, isLocked, recordFailure } from './login-throttle.server';
import { getAppSession } from './session.server';
import type { AuthResult, SessionUser } from './types';

/** The signed-in user, or null. Read by the root route's beforeLoad. */
export const getCurrentUser = createServerFn({ method: 'GET' }).handler(
  (): Promise<SessionUser | null> => readCurrentUser()
);

const signInSchema = z.object({
  username: z.string().trim().toLowerCase().min(1).max(64),
  password: z.string().min(1).max(256)
});

/** A 404 here means an API too old to have /auth/login, not a missing request as the copy says. */
function signInFailureMessage(error: unknown) {
  const code = apiErrorCode(error);
  return API_ERROR_COPY[code === 'not_found' ? 'unexpected' : code].title;
}

export const signIn = createServerFn({ method: 'POST' })
  .validator(signInSchema)
  .handler(async ({ data }): Promise<AuthResult> => {
    if (isLocked(data.username)) {
      return { error: `ลองผิดหลายครั้งเกินไป รอ ${LOCK_MINUTES} นาทีแล้วลองใหม่` };
    }
    let user: SessionUser | null;
    try {
      user = await verifyCredentials(data.username, data.password);
    } catch (error) {
      // Not a guess at the password, so it does not count toward the lock.
      return { error: signInFailureMessage(error) };
    }
    if (!user) {
      recordFailure(data.username);
      return { error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' };
    }
    clearFailures(data.username);

    const session = await getAppSession();
    session.user = user;
    await session.save();
    return { user };
  });

export const signOut = createServerFn({ method: 'POST' }).handler(async () => {
  const session = await getAppSession();
  session.destroy();
});
