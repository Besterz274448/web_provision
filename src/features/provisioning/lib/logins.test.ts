import { describe, expect, test } from 'bun:test';
import { adminUsername, vehicleRange, vehicleUsername } from './logins';

describe('logins', () => {
  test('follow the patterns the API uses', () => {
    expect(adminUsername(' TN01 ')).toBe('admin_tn01');
    expect(vehicleUsername('van', 1, 'TN01')).toBe('vansale01_tn01');
    expect(vehicleUsername('delivery', 5, 'TN01')).toBe('poduser05_tn01');
    expect(vehicleUsername('van', 100, 'TN01')).toBe('vansale100_tn01');
  });

  test('describe the range a count makes', () => {
    expect(vehicleRange('delivery', 5, 'ab')).toBe('poduser01_ab ถึง poduser05_ab');
    expect(vehicleRange('van', 1, 'ab')).toBe('vansale01_ab');
    expect(vehicleRange('van', 0, 'ab')).toBeNull();
  });
});
