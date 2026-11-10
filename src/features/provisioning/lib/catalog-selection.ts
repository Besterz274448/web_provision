/** Ticks or unticks a brand, keeping the order the brands were ticked in. */
export function toggleBrand(brands: string[], brand: string, checked: boolean) {
  if (checked) return brands.includes(brand) ? brands : [...brands, brand];
  return brands.filter((name) => name !== brand);
}

/** The brands as one line, for the confirmation and the request page. */
export function describeBrands(brands: string[]) {
  return brands.join(', ');
}
