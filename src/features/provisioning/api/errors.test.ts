import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { SIGNED_OUT_MESSAGE } from '@/features/auth/utils';
import { apiError, isTransientError, retryOnceIfTransient } from './errors';

// What the browser's server function stub throws when the dev server answers a plain 500.
const droppedConnection = new Error('Internal Server Error');

describe('isTransientError', () => {
  test('a dropped connection or an unreachable API may clear by itself', () => {
    expect(isTransientError(droppedConnection)).toBe(true);
    expect(isTransientError(apiError('unreachable'))).toBe(true);
    expect(isTransientError(apiError('unexpected'))).toBe(true);
  });

  test('a wrong setting, a missing request or an ended session will not', () => {
    expect(isTransientError(apiError('unauthorized'))).toBe(false);
    expect(isTransientError(apiError('not_configured'))).toBe(false);
    expect(isTransientError(apiError('not_found'))).toBe(false);
    expect(isTransientError(new Error(SIGNED_OUT_MESSAGE))).toBe(false);
  });
});

describe('retryOnceIfTransient', () => {
  const global = globalThis as { document?: unknown };

  describe('in the browser', () => {
    beforeEach(() => {
      global.document = {};
    });
    afterEach(() => {
      delete global.document;
    });

    test('tries a transient failure once more, and no further', () => {
      expect(retryOnceIfTransient(0, droppedConnection)).toBe(true);
      expect(retryOnceIfTransient(1, droppedConnection)).toBe(false);
    });

    test('does not repeat a failure that would end the same way', () => {
      expect(retryOnceIfTransient(0, new Error(SIGNED_OUT_MESSAGE))).toBe(false);
      expect(retryOnceIfTransient(0, apiError('not_found'))).toBe(false);
    });
  });

  test('never on the server, where it would hold up the page', () => {
    expect(retryOnceIfTransient(0, droppedConnection)).toBe(false);
  });
});
