import {
  IconAlertTriangle,
  IconBan,
  IconCircleCheck,
  IconCircleX,
  IconClock,
  IconHourglass,
  IconLoader2,
  IconUserCheck
} from '@tabler/icons-react';
import { cn } from '@/lib/utils';
import { DISPLAY_STATUS, type DisplayStatus, type StatusTone } from '../lib/status';

const ICONS: Record<DisplayStatus, typeof IconClock> = {
  queued: IconClock,
  retrying: IconHourglass,
  processing: IconLoader2,
  completed: IconCircleCheck,
  partial: IconAlertTriangle,
  rejected: IconCircleX,
  failed: IconCircleX,
  waiting: IconHourglass,
  stalled: IconAlertTriangle,
  awaiting: IconUserCheck,
  declined: IconBan
};

export const TONE_TEXT: Record<StatusTone, string> = {
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-destructive',
  active: 'text-primary',
  neutral: 'text-muted-foreground'
};

export function StatusLabel({ status, className }: { status: DisplayStatus; className?: string }) {
  const { label, tone } = DISPLAY_STATUS[status];
  const Icon = ICONS[status];
  return (
    <span
      className={cn('inline-flex items-center gap-1.5 font-medium', TONE_TEXT[tone], className)}
    >
      <Icon
        aria-hidden='true'
        className={cn('size-4 shrink-0', status === 'processing' && 'animate-spin')}
      />
      {label}
    </span>
  );
}
