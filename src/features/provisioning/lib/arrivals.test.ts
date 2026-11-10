import { describe, expect, test } from 'bun:test';
import { newArrivals, titleWithCount } from './arrivals';

describe('newArrivals', () => {
  test('announces nothing on the first look', () => {
    expect(newArrivals(null, ['a', 'b'])).toEqual([]);
  });

  test('returns only the ids not seen before', () => {
    expect(newArrivals(new Set(['a']), ['c', 'a', 'b'])).toEqual(['c', 'b']);
    expect(newArrivals(new Set(['a', 'b']), ['a'])).toEqual([]);
  });
});

describe('titleWithCount', () => {
  test('puts the count in front and replaces an old one', () => {
    expect(titleWithCount('คำขอ Provisioning', 3)).toBe('(3) คำขอ Provisioning');
    expect(titleWithCount('(3) คำขอ Provisioning', 4)).toBe('(4) คำขอ Provisioning');
  });

  test('drops the count when nothing waits', () => {
    expect(titleWithCount('(2) คำขอ Provisioning', 0)).toBe('คำขอ Provisioning');
    expect(titleWithCount('คำขอ Provisioning', 0)).toBe('คำขอ Provisioning');
  });
});
