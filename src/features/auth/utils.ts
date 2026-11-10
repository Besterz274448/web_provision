export const AFTER_SIGN_IN_PATH = '/dashboard/provisioning';

/** The error a server function raises when its caller has no session. */
export const SIGNED_OUT_MESSAGE = 'auth:signed_out';

export function isSignedOutError(error: unknown) {
  return error instanceof Error && error.message === SIGNED_OUT_MESSAGE;
}

/**
 * Only a path on this site may be a redirect target. A link such as
 * /auth/sign-in?redirect=https://evil.example must not send someone off-site after they log in.
 */
export function safeRedirectPath(target: string | undefined) {
  if (!target || !target.startsWith('/')) return AFTER_SIGN_IN_PATH;
  // Browsers read //host and /\host as another site, and strip tabs and newlines before parsing.
  if (/^\/[/\\]/.test(target) || /[\t\r\n]/.test(target)) return AFTER_SIGN_IN_PATH;
  return target;
}
