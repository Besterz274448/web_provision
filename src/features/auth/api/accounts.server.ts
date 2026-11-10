// Accounts live in the console_users table of tenant-provisioning, which checks the passwords.
// There is no sign-up, so adding or removing a person is a change to that table.

import { apiGet, apiPost } from '@/features/provisioning/api/client.server';
import { apiError, apiErrorCode } from '@/features/provisioning/api/errors';
import type { SessionUser } from './types';

/**
 * The user when the password is right, or null when it is wrong. A problem reaching the API throws
 * instead, so the sign-in form does not call a broken connection a wrong password.
 */
export async function verifyCredentials(
  username: string,
  password: string
): Promise<SessionUser | null> {
  const result = await apiPost<SessionUser>('/auth/login', { username, password });
  if ('refused' in result) {
    if (result.status === 403) return null;
    console.error(`provisioning API answered ${result.status} for POST /auth/login`);
    throw apiError('unexpected');
  }
  return { id: result.id, username: result.username };
}

/**
 * False only when the API says the account is gone. If the API cannot answer, the session stays,
 * because no private data can be read without the API and those pages show the real problem.
 */
export async function accountExists(id: string) {
  try {
    await apiGet(`/console-users/${encodeURIComponent(id)}`);
    return true;
  } catch (error) {
    return apiErrorCode(error) !== 'not_found';
  }
}
