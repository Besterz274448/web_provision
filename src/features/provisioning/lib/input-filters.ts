/**
 * What each kind of field lets through as it is typed or pasted. Anything else is dropped before it
 * reaches the form, so a letter never lands in a phone number. The schema still checks the result,
 * because a value can be the right characters and still be wrong, such as a phone with 5 digits.
 */
export type InputFilter = (value: string) => string;

const THAI_DIGITS = '๐๑๒๓๔๕๖๗๘๙';

/** Thai numerals become 0–9, so someone typing with Thai digits gets the number they meant. */
const arabicDigits = (value: string) =>
  value.replace(/[๐-๙]/g, (digit) => String(THAI_DIGITS.indexOf(digit)));

/** 0–9 only, for counts, region and postal code. */
export const digitsOnly: InputFilter = (value) => arabicDigits(value).replace(/[^0-9]/g, '');

/** Digits, spaces and dashes, and a + only as the first character, as the API allows. */
export const phoneChars: InputFilter = (value) => {
  const kept = arabicDigits(value).replace(/[^0-9+ -]/g, '');
  const leadingPlus = kept.trimStart().startsWith('+');
  const rest = kept.replace(/\+/g, '');
  return leadingPlus ? `+${rest.trimStart()}` : rest;
};

/** A signed decimal: digits, one dot, and a minus only in front. */
export const decimalChars: InputFilter = (value) => {
  const kept = arabicDigits(value).replace(/[^0-9.-]/g, '');
  const negative = kept.startsWith('-');
  const [whole = '', ...fraction] = kept.replace(/-/g, '').split('.');
  const number = fraction.length > 0 ? `${whole}.${fraction.join('')}` : whole;
  return negative ? `-${number}` : number;
};

/** English letters and digits, for the order prefix. */
export const alphanumeric: InputFilter = (value) => value.replace(/[^A-Za-z0-9]/g, '');

/** What a username may hold: English letters, digits, dot, dash and underscore. */
export const usernameChars: InputFilter = (value) => value.replace(/[^A-Za-z0-9._-]/g, '');

/** What a UUID is made of: hex digits and dashes. */
export const uuidChars: InputFilter = (value) => value.replace(/[^0-9A-Fa-f-]/g, '');

/** An email address never holds a space. */
export const noSpaces: InputFilter = (value) => value.replace(/\s/g, '');

/**
 * Where the caret goes once a value is filtered: after the characters that were kept before it.
 * Without this the caret jumps to the end whenever a character is dropped mid-text.
 */
export const filteredCaret = (filter: InputFilter, raw: string, caret: number) =>
  filter(raw.slice(0, caret)).length;
