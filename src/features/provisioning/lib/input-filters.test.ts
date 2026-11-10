import { describe, expect, test } from 'bun:test';
import {
  alphanumeric,
  decimalChars,
  digitsOnly,
  filteredCaret,
  noSpaces,
  phoneChars,
  usernameChars,
  uuidChars
} from './input-filters';

describe('phoneChars', () => {
  test('drops letters and keeps spaces and dashes', () => {
    expect(phoneChars('08a1-234 56x78')).toBe('081-234 5678');
  });
  test('keeps a + only in front', () => {
    expect(phoneChars('+66 81+234')).toBe('+66 81234');
    expect(phoneChars('081+')).toBe('081');
  });
  test('turns Thai digits into 0-9', () => {
    expect(phoneChars('๐๘๑-๒๓๔-๕๖๗๘')).toBe('081-234-5678');
  });
  test('drops brackets from a pasted number', () => {
    expect(phoneChars('(02) 123-4567')).toBe('02 123-4567');
  });
});

describe('digitsOnly', () => {
  test('keeps 0-9 only', () => {
    expect(digitsOnly('1a2.3-')).toBe('123');
    expect(digitsOnly('๑๐๕๐๐')).toBe('10500');
  });
});

describe('decimalChars', () => {
  test('keeps one dot and a minus in front', () => {
    expect(decimalChars('13.72.48')).toBe('13.7248');
    expect(decimalChars('-13.5')).toBe('-13.5');
    expect(decimalChars('13-5')).toBe('135');
    expect(decimalChars('-')).toBe('-');
    expect(decimalChars('abc')).toBe('');
  });
});

describe('text filters', () => {
  test('prefix keeps English letters and digits', () => {
    expect(alphanumeric('tn-0ก1')).toBe('tn01');
  });
  test('username keeps letters, digits, dot, dash and underscore', () => {
    expect(usernameChars('admin tn01@ร้าน_.x-')).toBe('admintn01_.x-');
  });
  test('uuid keeps hex and dashes', () => {
    expect(uuidChars(' 0f8fad5b-zz ')).toBe('0f8fad5b-');
  });
  test('email loses spaces', () => {
    expect(noSpaces(' name @example.com ')).toBe('name@example.com');
  });
});

describe('filteredCaret', () => {
  test('stays after the kept characters before it', () => {
    // "08x1" with the caret after the x: the x is dropped, so the caret sits after "08".
    expect(filteredCaret(digitsOnly, '08x1', 3)).toBe(2);
    expect(filteredCaret(digitsOnly, '081', 3)).toBe(3);
  });
});
