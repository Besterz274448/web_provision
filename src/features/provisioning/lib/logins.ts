/** The admin login every tenant gets. The API makes it the same way, from the order prefix. */
export function adminUsername(orderPrefix: string) {
  return `admin_${orderPrefix.trim().toLowerCase()}`;
}

/**
 * The login of vehicle no, numbered from 1 with at least two digits: 5 vans are vansale01 to
 * vansale05. The API appends the order prefix the same way.
 */
export function vehicleUsername(type: 'van' | 'delivery', no: number, orderPrefix: string) {
  const base = type === 'van' ? 'vansale' : 'poduser';
  return `${base}${String(no).padStart(2, '0')}_${orderPrefix.trim().toLowerCase()}`;
}

/** The first and last login of count vehicles, for showing what will be made. */
export function vehicleRange(type: 'van' | 'delivery', count: number, orderPrefix: string) {
  if (count <= 0) return null;
  const first = vehicleUsername(type, 1, orderPrefix);
  return count === 1 ? first : `${first} ถึง ${vehicleUsername(type, count, orderPrefix)}`;
}
