/** What an address list item has in common: a Thai name, an English name, and maybe a zip code. */
export type AddressItem = { name_th: string; name_en: string; zip_code?: string };

// What people type in front of a name, which the address master leaves out.
const PREFIXES = ['จังหวัด', 'จ.', 'อำเภอ', 'อ.', 'เขต', 'ตำบล', 'ต.', 'แขวง'];

const PROVINCE_ALIASES: Record<string, string> = {
  กทม: 'กรุงเทพมหานคร',
  'กทม.': 'กรุงเทพมหานคร',
  กรุงเทพ: 'กรุงเทพมหานคร',
  กรุงเทพฯ: 'กรุงเทพมหานคร'
};

/** A name without spaces and the prefix someone may have typed, for comparing with the master. */
export function normalizeName(name: string) {
  let value = name.replace(/\s+/g, '');
  for (const prefix of PREFIXES) {
    if (value.startsWith(prefix) && value.length > prefix.length) {
      value = value.slice(prefix.length);
      break;
    }
  }
  return PROVINCE_ALIASES[value] ?? value;
}

/**
 * The item a stored name stands for, such as the province a survey answered. Only an exact match
 * after normalizing counts, so a typo finds nothing rather than the wrong place.
 */
export function findByName<T extends AddressItem>(items: readonly T[] | undefined, name: string) {
  if (!items || !name.trim()) return undefined;
  const wanted = normalizeName(name);
  return items.find((item) => normalizeName(item.name_th) === wanted);
}

/** Whether an item matches what someone typed: part of the Thai or English name, or a zip code. */
export function matchesQuery(item: AddressItem, query: string) {
  const typed = query.trim();
  if (!typed) return true;
  if (item.zip_code && /^\d+$/.test(typed)) return item.zip_code.startsWith(typed);
  const thai = normalizeName(typed);
  return (
    item.name_th.replace(/\s+/g, '').includes(thai) ||
    item.name_en.toLowerCase().includes(typed.toLowerCase())
  );
}
