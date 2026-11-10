import { describe, expect, test } from 'bun:test';
import { findByName, matchesQuery, normalizeName } from './address';

const provinces = [
  { id: 10, name_th: 'กรุงเทพมหานคร', name_en: 'Bangkok' },
  { id: 20, name_th: 'ชลบุรี', name_en: 'Chon Buri' }
];

describe('normalizeName', () => {
  test('drops spaces and the prefix people type', () => {
    expect(normalizeName(' จังหวัด ชลบุรี ')).toBe('ชลบุรี');
    expect(normalizeName('อ.เมืองชลบุรี')).toBe('เมืองชลบุรี');
    expect(normalizeName('เขตบางรัก')).toBe('บางรัก');
  });

  test('knows the short names of Bangkok', () => {
    expect(normalizeName('กทม.')).toBe('กรุงเทพมหานคร');
    expect(normalizeName('กรุงเทพฯ')).toBe('กรุงเทพมหานคร');
  });

  test('keeps a name that is only a prefix', () => {
    expect(normalizeName('เขต')).toBe('เขต');
  });
});

describe('findByName', () => {
  test('finds a survey answer written another way', () => {
    expect(findByName(provinces, 'จ.ชลบุรี')?.id).toBe(20);
    expect(findByName(provinces, 'กทม')?.id).toBe(10);
  });

  test('finds nothing for a blank name, an unknown name, or no list yet', () => {
    expect(findByName(provinces, '')).toBeUndefined();
    expect(findByName(provinces, 'ชลบุร')).toBeUndefined();
    expect(findByName(undefined, 'ชลบุรี')).toBeUndefined();
  });
});

describe('matchesQuery', () => {
  const sub = { name_th: 'บางปลาสร้อย', name_en: 'Bang Pla Soi', zip_code: '20000' };

  test('matches part of the Thai or English name', () => {
    expect(matchesQuery(sub, 'ปลา')).toBe(true);
    expect(matchesQuery(sub, 'pla soi')).toBe(true);
    expect(matchesQuery(sub, 'ตำบลบางปลา')).toBe(true);
    expect(matchesQuery(sub, 'นาข่า')).toBe(false);
  });

  test('matches the start of a zip code', () => {
    expect(matchesQuery(sub, '200')).toBe(true);
    expect(matchesQuery(sub, '201')).toBe(false);
  });

  test('matches everything when nothing is typed', () => {
    expect(matchesQuery(sub, '  ')).toBe(true);
  });
});
