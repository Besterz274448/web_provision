/** The signed-in user, as stored in the session cookie and exposed to routes. */
export type SessionUser = {
  id: string;
  username: string;
};

/** Server functions return expected failures (wrong password, too many tries) as data. */
export type AuthResult = { user: SessionUser; error?: never } | { user?: never; error: string };
