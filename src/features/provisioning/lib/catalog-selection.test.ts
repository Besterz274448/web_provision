import { describe, expect, test } from 'bun:test';
import { describeBrands, toggleBrand } from './catalog-selection';

describe('catalog brands', () => {
  test('ticking adds a brand once, unticking removes it', () => {
    const ticked = toggleBrand(toggleBrand([], 'TBV', true), 'Sermsuk', true);
    expect(ticked).toEqual(['TBV', 'Sermsuk']);
    expect(toggleBrand(ticked, 'TBV', true)).toEqual(['TBV', 'Sermsuk']);
    expect(toggleBrand(ticked, 'TBV', false)).toEqual(['Sermsuk']);
  });

  test('describes the brands on one line', () => {
    expect(describeBrands(['TBV', 'Philip Morris'])).toBe('TBV, Philip Morris');
  });
});
