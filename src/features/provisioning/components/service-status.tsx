import { IconCircleCheck, IconPlugConnectedX } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { serviceHealthQueryOptions } from '../api/queries';

/** Answers "is the service up?" apart from whether any one page of data loaded. */
export function ServiceStatus() {
  const { data: healthy } = useQuery(serviceHealthQueryOptions());
  if (healthy === undefined) return null;
  const Icon = healthy ? IconCircleCheck : IconPlugConnectedX;
  const label = healthy ? 'API ทำงานปกติ' : 'เชื่อมต่อ API ไม่ได้';
  return (
    <p
      role='status'
      title={label}
      className='flex items-center gap-2 px-2 py-1.5 text-xs text-sidebar-foreground group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0'
    >
      <Icon
        aria-hidden='true'
        className={healthy ? 'size-4 shrink-0 text-success' : 'size-4 shrink-0 text-destructive'}
      />
      <span className='truncate group-data-[collapsible=icon]:sr-only'>{label}</span>
    </p>
  );
}
