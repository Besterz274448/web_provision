import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { accountExists, verifyCredentials } from './api/accounts.server';
import {
  LOCK_MINUTES,
  MAX_FAILURES,
  clearFailures,
  isLocked,
  recordFailure
} from './api/login-throttle.server';
import { AFTER_SIGN_IN_PATH, safeRedirectPath } from './utils';

describe('accounts through the provisioning API', () => {
  const realFetch = globalThis.fetch;
  let calls: { url: string; init?: RequestInit }[] = [];

  function answer(status: number, body = '') {
    calls = [];
    globalThis.fetch = (async (url: string, init?: RequestInit) => {
      calls.push({ url, init });
      return new Response(body, { status });
    }) as unknown as typeof fetch;
  }

  beforeEach(() => {
    process.env.PROVISIONING_API_URL = 'http://api.test';
    process.env.PROVISIONING_SERVICE_TOKEN = 'token';
  });

  afterEach(() => {
    globalThis.fetch = realFetch;
    delete process.env.PROVISIONING_API_URL;
    delete process.env.PROVISIONING_SERVICE_TOKEN;
  });

  test('returns only the id and username of the user the API accepted', async () => {
    answer(200, '{"id":"u1","username":"admin","extra":"x"}');
    expect(await verifyCredentials('admin', 'right-password')).toEqual({
      id: 'u1',
      username: 'admin'
    });
    expect(calls[0].url).toBe('http://api.test/auth/login');
    expect(JSON.parse(String(calls[0].init?.body))).toEqual({
      username: 'admin',
      password: 'right-password'
    });
  });

  test('a 403 is a wrong password', async () => {
    answer(403, 'invalid username or password');
    expect(await verifyCredentials('admin', 'wrong-password')).toBeNull();
  });

  test.each([
    [401, 'unauthorized'],
    [404, 'not_found'],
    [400, 'unexpected'],
    [500, 'unexpected']
  ])('a %d is not a wrong password', async (status, code) => {
    answer(status);
    await expect(verifyCredentials('admin', 'any-password')).rejects.toThrow(
      `provisioning_api:${code}`
    );
  });

  test('an unreachable API is not a wrong password', async () => {
    globalThis.fetch = (async () => {
      throw new Error('refused');
    }) as unknown as typeof fetch;
    await expect(verifyCredentials('admin', 'any-password')).rejects.toThrow(
      'provisioning_api:unreachable'
    );
  });

  test('an account ends only when the API says it is gone', async () => {
    answer(200, '{"id":"u1","username":"admin"}');
    expect(await accountExists('u1')).toBe(true);
    expect(calls[0].url).toBe('http://api.test/console-users/u1');

    answer(404);
    expect(await accountExists('u1')).toBe(false);

    answer(500);
    expect(await accountExists('u1')).toBe(true);
    answer(401);
    expect(await accountExists('u1')).toBe(true);
  });
});

describe('login throttle', () => {
  const start = 1_000_000;

  test('locks after the limit and unlocks when the window ends', () => {
    const name = 'throttle-window';
    for (let i = 0; i < MAX_FAILURES - 1; i++) recordFailure(name, start);
    expect(isLocked(name, start)).toBe(false);
    recordFailure(name, start);
    expect(isLocked(name, start)).toBe(true);
    expect(isLocked(name, start + LOCK_MINUTES * 60_000)).toBe(false);
  });

  test('more failures do not extend the lock', () => {
    const name = 'throttle-extend';
    for (let i = 0; i < MAX_FAILURES; i++) recordFailure(name, start);
    recordFailure(name, start + 60_000);
    expect(isLocked(name, start + LOCK_MINUTES * 60_000)).toBe(false);
  });

  test('a successful sign-in clears the count', () => {
    const name = 'throttle-clear';
    for (let i = 0; i < MAX_FAILURES - 1; i++) recordFailure(name, start);
    clearFailures(name);
    recordFailure(name, start);
    expect(isLocked(name, start)).toBe(false);
  });

  test('one username does not lock another', () => {
    for (let i = 0; i < MAX_FAILURES; i++) recordFailure('throttle-a', start);
    expect(isLocked('throttle-b', start)).toBe(false);
  });
});

describe('safeRedirectPath', () => {
  test('keeps a path on this site, with its query', () => {
    expect(safeRedirectPath('/dashboard/provisioning/abc?x=1')).toBe(
      '/dashboard/provisioning/abc?x=1'
    );
  });

  test.each([
    [undefined],
    [''],
    ['https://evil.example'],
    ['//evil.example'],
    ['/\\evil.example'],
    ['/\t/evil.example'],
    ['javascript:alert(1)']
  ])('falls back for %p', (target) => {
    expect(safeRedirectPath(target)).toBe(AFTER_SIGN_IN_PATH);
  });
});
