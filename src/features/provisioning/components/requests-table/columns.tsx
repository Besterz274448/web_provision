import { Link } from '@tanstack/react-router';
import type { ColumnDef } from '@tanstack/react-table';
import type { DataTableFeatures } from '@/lib/data-table-features';
import type { RequestSummary } from '../../api/types';
import { useIsNewArrival } from '../../lib/arrivals';
import { formatDateTime, timeAgo, timeUntil, useNow } from '../../lib/format';
import { progressSummary } from '../../lib/progress';
import { displayStatus, isBeforeProvisioning } from '../../lib/status';
import { requestTitle } from '../../lib/survey';
import { PipelineTrack } from '../pipeline-track';
import { StatusLabel } from '../status-label';
import { ThaiBevTag } from '../thaibev-tag';

const SOURCE_LABEL: Record<string, string> = { survey: 'แบบสำรวจ', ccplus: 'CCPlus' };

/** Where a request came from. A request made in this console has no tag. */
function SourceTag({ source }: { source: string }) {
  const label = SOURCE_LABEL[source];
  if (!label) return null;
  return (
    <span className='mr-1.5 inline-flex h-4.5 items-center rounded-sm bg-muted px-1.5 align-[1px] text-xs font-medium text-muted-foreground'>
      {label}
    </span>
  );
}

/** A survey that came in while this console was open. */
function NewMark({ id }: { id: string }) {
  if (!useIsNewArrival(id)) return null;
  return (
    <span className='mr-1.5 inline-flex h-4.5 items-center rounded-sm bg-warning/15 px-1.5 align-[1px] text-xs font-semibold text-warning'>
      ใหม่
    </span>
  );
}

function StatusCell({ request }: { request: RequestSummary }) {
  const now = useNow();
  const status = displayStatus(request);
  return (
    <div>
      <StatusLabel status={status} />
      <p className='mt-0.5 min-h-4 text-xs text-muted-foreground'>
        {status === 'awaiting' && request.demo_at
          ? `นัด Demo ${formatDateTime(request.demo_at)}`
          : status === 'retrying' && request.next_attempt_at && now !== null
            ? timeUntil(request.next_attempt_at, now)
            : request.attempt_count > 0 && `ทำไปแล้ว ${request.attempt_count} ครั้ง`}
      </p>
      {/* Narrow screens drop the other columns, so what they said moves here. */}
      {!isBeforeProvisioning(request.status) && (
        <p className='mt-0.5 text-xs text-muted-foreground sm:hidden'>{progressSummary(request)}</p>
      )}
      {request.last_error_code && (
        <code className='mt-0.5 block font-mono text-xs font-medium xl:hidden'>
          {request.last_error_code}
        </code>
      )}
    </div>
  );
}

function CauseCell({ request }: { request: RequestSummary }) {
  if (request.last_error_code) {
    return (
      <div className='max-w-80' title={request.last_error_message ?? undefined}>
        <code className='font-mono text-xs font-medium'>{request.last_error_code}</code>
        <p className='truncate text-xs text-muted-foreground'>{request.last_error_message}</p>
      </div>
    );
  }
  if (request.vehicles.failed > 0) {
    return <p className='text-xs'>รถล้ม {request.vehicles.failed} คัน Tenant เข้าใช้งานได้</p>;
  }
  if (request.catalog_status === 'failed') {
    return <p className='text-xs'>สร้างสินค้าตั้งต้นไม่สำเร็จ Tenant เข้าใช้งานได้</p>;
  }
  return <span className='text-muted-foreground'>–</span>;
}

function RequestedCell({ iso }: { iso: string }) {
  const now = useNow();
  return (
    <div>
      <p className='tabular-nums'>{formatDateTime(iso)}</p>
      <p className='mt-0.5 min-h-4 text-xs text-muted-foreground'>
        {now !== null && timeAgo(iso, now)}
      </p>
    </div>
  );
}

export const columns: ColumnDef<DataTableFeatures, RequestSummary>[] = [
  {
    id: 'supplier',
    accessorKey: 'supplier_name',
    header: 'Tenant',
    enableSorting: false,
    cell: ({ row }) => (
      <div className='max-w-40 sm:max-w-72'>
        {/* The link covers the whole row, while the row stays a real table row for screen readers. */}
        <Link
          to='/dashboard/provisioning/$id'
          params={{ id: row.original.id }}
          className='block truncate font-medium after:absolute after:inset-0 after:content-[""] focus-visible:outline-none focus-visible:after:rounded-sm focus-visible:after:ring-2 focus-visible:after:ring-ring focus-visible:after:ring-inset'
        >
          <NewMark id={row.original.id} />
          <SourceTag source={row.original.source} />
          {row.original.thaibev_staff && <ThaiBevTag className='mr-1.5 align-[1px]' />}
          {requestTitle(row.original)}
        </Link>
        <p className='mt-0.5 truncate text-xs text-muted-foreground'>
          {row.original.order_prefix ? (
            <code className='font-mono'>{row.original.order_prefix}</code>
          ) : (
            <span className='tabular-nums'>{row.original.contact_phone ?? 'ไม่มีเบอร์'}</span>
          )}
          {row.original.province && ` · ${row.original.province}`}
        </p>
        <p className='mt-0.5 text-xs text-muted-foreground tabular-nums xl:hidden'>
          {formatDateTime(row.original.requested_at)}
        </p>
      </div>
    )
  },
  {
    id: 'status',
    accessorKey: 'status',
    header: 'สถานะ',
    enableSorting: false,
    cell: ({ row }) => <StatusCell request={row.original} />
  },
  {
    id: 'progress',
    header: 'ความคืบหน้า',
    enableSorting: false,
    meta: { className: 'hidden sm:table-cell' },
    cell: ({ row }) =>
      isBeforeProvisioning(row.original.status) ? (
        <span className='text-xs text-muted-foreground'>ยังไม่เริ่ม</span>
      ) : (
        <PipelineTrack request={row.original} />
      )
  },
  {
    id: 'cause',
    header: 'สาเหตุ',
    enableSorting: false,
    meta: { className: 'hidden xl:table-cell' },
    cell: ({ row }) => <CauseCell request={row.original} />
  },
  {
    id: 'requested_at',
    accessorKey: 'requested_at',
    header: 'ส่งคำขอเมื่อ',
    enableSorting: false,
    meta: { className: 'hidden xl:table-cell' },
    cell: ({ row }) => <RequestedCell iso={row.original.requested_at} />
  }
];
