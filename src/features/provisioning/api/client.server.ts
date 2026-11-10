import { apiError } from './errors';
import type { Credential } from './types';

const TIMEOUT_MS = 8000;

function apiUrl(path: string) {
  const base = process.env.PROVISIONING_API_URL;
  if (!base) throw apiError('not_configured');
  return `${base.replace(/\/+$/, '')}${path}`;
}

/**
 * Logs why a call never got an answer (refused, DNS, timeout, TLS), then returns the error to throw.
 * The log names the address without its query and never the headers, which hold the token.
 */
function unreachable(url: string, error: unknown) {
  const { origin, pathname } = new URL(url);
  const cause = error instanceof Error ? error.cause : undefined;
  const code =
    cause && typeof cause === 'object' && 'code' in cause ? String(cause.code) : undefined;
  const reason = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
  console.error(
    `provisioning API unreachable at ${origin}${pathname}: ${reason}${code ? ` (${code})` : ''}`
  );
  return apiError('unreachable');
}

function serviceHeaders() {
  const token = process.env.PROVISIONING_SERVICE_TOKEN;
  if (!token) throw apiError('not_configured');
  return { Authorization: `Bearer ${token}` };
}

/** Calls the provisioning API with the service token, which must never reach the browser. */
export async function apiGet<T>(path: string): Promise<T> {
  const url = apiUrl(path);
  const headers = serviceHeaders();

  let res: Response;
  try {
    res = await fetch(url, { headers, signal: AbortSignal.timeout(TIMEOUT_MS) });
  } catch (error) {
    throw unreachable(url, error);
  }

  if (res.status === 401) throw apiError('unauthorized');
  if (res.status === 404) throw apiError('not_found');
  if (!res.ok) {
    console.error(`provisioning API answered ${res.status} for ${path.split('?')[0]}`);
    throw apiError('unexpected');
  }
  return (await res.json()) as T;
}

/** The API refused the request and said why, as opposed to being unreachable or broken. */
export type ApiRefusal = { refused: string; status: number };

/**
 * POSTs to the API. A refusal comes back as data, because the form shows it next to the fields.
 * The body may hold a password, so it is never logged. actor names the person, for a call the API
 * records under their name.
 */
export async function apiPost<T>(
  path: string,
  body?: unknown,
  actor?: string
): Promise<T | ApiRefusal> {
  const url = apiUrl(path);
  const headers: Record<string, string> = serviceHeaders();
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (actor !== undefined) headers['X-Actor'] = actor;

  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(TIMEOUT_MS)
    });
  } catch (error) {
    throw unreachable(url, error);
  }

  if (res.status === 401) throw apiError('unauthorized');
  if (res.status === 404) throw apiError('not_found');
  if (res.status === 400 || res.status === 403 || res.status === 409) {
    return { refused: await res.text(), status: res.status };
  }
  if (!res.ok) {
    console.error(`provisioning API answered ${res.status} for POST ${path}`);
    throw apiError('unexpected');
  }
  return (await res.json()) as T;
}

/**
 * Reads every login with its password. The API audits each call under this actor, so a caller must
 * only do this when a person asks. The answer is never logged.
 */
export async function apiRevealCredentials(id: string, actor: string) {
  const url = apiUrl(`/provisioning-requests/${encodeURIComponent(id)}/credentials`);
  const headers = { ...serviceHeaders(), 'X-Actor': actor };

  let res: Response;
  try {
    res = await fetch(url, { headers, signal: AbortSignal.timeout(TIMEOUT_MS) });
  } catch (error) {
    throw unreachable(url, error);
  }

  if (res.status === 401) throw apiError('unauthorized');
  if (res.status === 404) throw apiError('not_found');
  if (res.status === 409) return { error: 'not_finished' as const };
  if (res.status === 410) return { error: 'expired' as const };
  if (!res.ok) {
    console.error(`provisioning API answered ${res.status} when revealing credentials`);
    throw apiError('unexpected');
  }
  return (await res.json()) as { credentials: Credential[] };
}

/** Streams the login sheet. The API audits the download under this actor. */
export function apiCredentialsPdf(id: string, actor: string) {
  return fetch(apiUrl(`/provisioning-requests/${encodeURIComponent(id)}/credentials.pdf`), {
    headers: { ...serviceHeaders(), 'X-Actor': actor },
    signal: AbortSignal.timeout(TIMEOUT_MS)
  });
}

export async function apiIsHealthy() {
  try {
    const res = await fetch(apiUrl('/healthz'), { signal: AbortSignal.timeout(TIMEOUT_MS) });
    return res.ok;
  } catch {
    return false;
  }
}
