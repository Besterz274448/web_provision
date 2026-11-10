import { accountExists } from './accounts.server';
import { getAppSession } from './session.server';

/**
 * The session's user, as long as the account still exists. The session is only a cookie,
 * so this check is what ends someone's access as soon as they leave console_users.
 * A cookie from before accounts had an ID has no user to look up, so it counts as signed out.
 */
export async function readCurrentUser() {
  const session = await getAppSession();
  if (!session.user?.id) return null;
  return (await accountExists(session.user.id)) ? session.user : null;
}
