import { useLocation } from '@tanstack/react-router';
import { useMemo } from 'react';

const REQUESTS_PATH = '/dashboard/provisioning';
const REQUESTS_CRUMB = { title: 'คำขอ Provisioning', link: REQUESTS_PATH };

export function useBreadcrumbs() {
  const { pathname } = useLocation();

  return useMemo(() => {
    const id = pathname.startsWith(`${REQUESTS_PATH}/`)
      ? pathname.slice(REQUESTS_PATH.length + 1)
      : '';
    if (!id) return [REQUESTS_CRUMB];
    if (id === 'new') return [REQUESTS_CRUMB, { title: 'ขอ Provisioning ใหม่', link: pathname }];
    return [REQUESTS_CRUMB, { title: `คำขอ ${id.slice(0, 8)}`, link: pathname }];
  }, [pathname]);
}
