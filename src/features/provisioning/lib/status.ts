import type { RequestStatus } from '../api/types';

export type StatusTone = 'success' | 'warning' | 'danger' | 'active' | 'neutral';

export type DisplayStatus =
  | 'queued'
  | 'retrying'
  | 'processing'
  | 'completed'
  | 'partial'
  | 'rejected'
  | 'failed'
  | 'waiting'
  | 'stalled'
  | 'awaiting'
  | 'declined';

export const DISPLAY_STATUS: Record<DisplayStatus, { label: string; tone: StatusTone }> = {
  queued: { label: 'รอคิว', tone: 'neutral' },
  retrying: { label: 'รอลองใหม่', tone: 'warning' },
  processing: { label: 'กำลังทำ', tone: 'active' },
  completed: { label: 'สำเร็จ', tone: 'success' },
  partial: { label: 'สำเร็จบางส่วน', tone: 'warning' },
  rejected: { label: 'ข้อมูลไม่ผ่าน', tone: 'danger' },
  failed: { label: 'ล้มเหลว', tone: 'danger' },
  waiting: { label: 'รอระบบปลายทาง', tone: 'active' },
  stalled: { label: 'ไม่ได้รับการตอบกลับ', tone: 'danger' },
  awaiting: { label: 'รออนุมัติ', tone: 'warning' },
  declined: { label: 'ไม่อนุมัติ', tone: 'neutral' }
};

type StatusInput = {
  status: RequestStatus;
  last_error_code?: string | null;
  next_attempt_at?: string | null;
};

/** A pending request is either new or waiting out the backoff after a failed attempt. */
export function displayStatus(r: StatusInput): DisplayStatus {
  switch (r.status) {
    case 'pending':
      return r.last_error_code || r.next_attempt_at ? 'retrying' : 'queued';
    case 'processing':
      return 'processing';
    case 'completed':
      return 'completed';
    case 'completed_with_errors':
      return 'partial';
    case 'rejected':
      return 'rejected';
    case 'failed':
      return 'failed';
    case 'handed_off':
      return 'waiting';
    case 'stalled':
      return 'stalled';
    case 'awaiting_approval':
      return 'awaiting';
    case 'declined':
      return 'declined';
  }
}

/** Nothing has run for these, so there is no progress or history to show. */
export function isBeforeProvisioning(status: RequestStatus) {
  return status === 'awaiting_approval' || status === 'declined';
}

export function isFinalStatus(status: RequestStatus) {
  // A stalled request can still finish if the late callback arrives, so it keeps refreshing.
  return (
    status !== 'pending' &&
    status !== 'processing' &&
    status !== 'handed_off' &&
    status !== 'stalled'
  );
}

export const REQUEST_VIEWS = ['all', 'approval', 'attention', 'in_progress', 'completed'] as const;

export type RequestView = (typeof REQUEST_VIEWS)[number];

export const VIEW_STATUSES: Record<RequestView, RequestStatus[]> = {
  all: [],
  approval: ['awaiting_approval'],
  attention: ['failed', 'rejected', 'completed_with_errors', 'stalled'],
  in_progress: ['pending', 'processing', 'handed_off'],
  completed: ['completed']
};

export const VIEW_LABELS: Record<RequestView, string> = {
  all: 'ทั้งหมด',
  approval: 'รออนุมัติ',
  attention: 'ต้องตรวจสอบ',
  in_progress: 'กำลังดำเนินการ',
  completed: 'สำเร็จ'
};

export function viewCount(view: RequestView, counts: Partial<Record<RequestStatus, number>>) {
  const statuses = view === 'all' ? (Object.keys(counts) as RequestStatus[]) : VIEW_STATUSES[view];
  return statuses.reduce((sum, status) => sum + (counts[status] ?? 0), 0);
}
