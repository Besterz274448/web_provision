import { useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { useEffect, useRef } from 'react';
import { useToastManager } from '@/components/ui/toast';
import { awaitingApprovalQueryOptions } from '../api/queries';
import type { RequestSummary } from '../api/types';
import { markArrivals, newArrivals, titleWithCount } from '../lib/arrivals';
import { requestTitle } from '../lib/survey';

const TOAST_ID = 'survey-arrivals';
const NAMES_SHOWN = 3;

/** How many survey requests wait for approval. Shared by the sidebar and the tab title. */
export function useAwaitingApprovalCount() {
  const { data } = useQuery(awaitingApprovalQueryOptions());
  return data?.total;
}

function describe(items: RequestSummary[]) {
  const names = items.slice(0, NAMES_SHOWN).map(requestTitle).join(', ');
  const more = items.length - NAMES_SHOWN;
  return `${names}${more > 0 ? ` และอีก ${more} ราย` : ''} รออนุมัติ`;
}

/**
 * Watches the approval list while the console is open. A survey that comes in shows a toast,
 * a "ใหม่" mark on its row and a count in the tab title. It renders nothing itself.
 */
export function ApprovalAlerts() {
  const { data } = useQuery(awaitingApprovalQueryOptions());
  const toasts = useToastManager();
  const navigate = useNavigate();
  const seen = useRef<Set<string> | null>(null);
  // Arrivals in the toast that is open now, newest first. One toast grows instead of many stacking.
  const unread = useRef<RequestSummary[]>([]);
  const count = data?.total ?? 0;

  useEffect(() => {
    if (!data) return;
    const ids = data.items.map((item) => item.id);
    const fresh = new Set(newArrivals(seen.current, ids));
    seen.current = new Set([...(seen.current ?? []), ...ids]);
    if (fresh.size === 0) return;

    markArrivals([...fresh]);
    unread.current = [...data.items.filter((item) => fresh.has(item.id)), ...unread.current];
    const items = unread.current;
    const only = items.length === 1 ? items[0] : null;
    toasts.add({
      id: TOAST_ID,
      title: only ? 'มีคำขอใหม่' : `มีคำขอใหม่ ${items.length} รายการ`,
      description: describe(items),
      // Stays until closed: the person may be in another tab when it comes in.
      timeout: 0,
      onClose: () => {
        unread.current = [];
      },
      actionProps: {
        children: only ? 'เปิดคำขอ' : 'ดูที่รออนุมัติ',
        onClick: () => {
          toasts.close(TOAST_ID);
          void (only
            ? navigate({ to: '/dashboard/provisioning/$id', params: { id: only.id } })
            : navigate({ to: '/dashboard/provisioning', search: { view: 'approval' } }));
        }
      }
    });
  }, [data, navigate, toasts]);

  // The router rewrites the title on every navigation, so the count is put back each time.
  useEffect(() => {
    const apply = () => {
      const next = titleWithCount(document.title, count);
      if (next !== document.title) document.title = next;
    };
    apply();
    const observer = new MutationObserver(apply);
    observer.observe(document.head, { childList: true, subtree: true, characterData: true });
    return () => {
      observer.disconnect();
      document.title = titleWithCount(document.title, 0);
    };
  }, [count]);

  return null;
}
