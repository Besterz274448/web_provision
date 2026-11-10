import { IconSearch } from '@tabler/icons-react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useQueryStates } from 'nuqs';
import { useState } from 'react';
import { DataTable } from '@/components/data-table/data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDataTable } from '@/hooks/use-data-table';
import { useDebouncedCallback } from '@/hooks/use-debounced-callback';
import { cn } from '@/lib/utils';
import { requestListQueryOptions } from '../../api/queries';
import type { RequestSummary } from '../../api/types';
import { formatClock } from '../../lib/format';
import { REQUEST_VIEWS, type RequestView, VIEW_LABELS, viewCount } from '../../lib/status';
import { ApiErrorPanel, StaleDataNotice } from '../api-error';
import { Freshness } from '../freshness';
import { columns } from './columns';
import { DEFAULT_PAGE_SIZE, getRequestFilters, requestsSearchParams } from './search-params';

const SEARCH_DEBOUNCE_MS = 300;

const EMPTY_COPY: Record<RequestView, { title: string; body: string }> = {
  all: {
    title: 'ยังไม่มีคำขอ Provisioning',
    body: 'คำขอจะขึ้นที่นี่ทันทีที่แบบสำรวจส่งเข้ามา หรือมีคนสร้างคำขอ'
  },
  approval: {
    title: 'ไม่มีคำขอที่รออนุมัติ',
    body: 'ลูกค้าที่กรอกแบบสำรวจจะขึ้นในแท็บนี้ และยังไม่สร้าง Tenant จนกว่าจะอนุมัติ'
  },
  attention: {
    title: 'ไม่มีคำขอที่ต้องตรวจสอบ',
    body: 'คำขอที่ล้มเหลว ข้อมูลไม่ผ่าน หรือมีรถล้มจะขึ้นในแท็บนี้'
  },
  in_progress: {
    title: 'ไม่มีคำขอที่กำลังดำเนินการ',
    body: 'คำขอที่รอคิว รอลองใหม่ หรือกำลังทำจะขึ้นในแท็บนี้'
  },
  completed: {
    title: 'ยังไม่มีคำขอที่สำเร็จ',
    body: 'คำขอที่ตั้ง Tenant และรถครบแล้วจะขึ้นในแท็บนี้'
  }
};

function RequestsDataTable({
  items,
  pageCount,
  emptyState
}: {
  items: RequestSummary[];
  pageCount: number;
  emptyState: React.ReactNode;
}) {
  const { table } = useDataTable({
    data: items,
    columns,
    pageCount,
    shallow: true,
    debounceMs: 0,
    getRowId: (row) => row.id,
    initialState: { pagination: { pageIndex: 0, pageSize: DEFAULT_PAGE_SIZE } }
  });
  return <DataTable table={table} aria-label='คำขอ Provisioning' emptyState={emptyState} />;
}

export function RequestsTable() {
  const [search, setSearch] = useQueryStates(requestsSearchParams);
  const [draft, setDraft] = useState(search.q);
  const writeQuery = useDebouncedCallback((q: string) => {
    void setSearch({ q: q || null, page: null });
  }, SEARCH_DEBOUNCE_MS);

  const filters = getRequestFilters(search);
  const query = useQuery({
    ...requestListQueryOptions(filters),
    placeholderData: keepPreviousData
  });
  const data = query.data;
  const empty = EMPTY_COPY[search.view];

  return (
    <div className='flex flex-col gap-4'>
      <Tabs
        value={search.view}
        onValueChange={(view) => void setSearch({ view: view as RequestView, page: null })}
      >
        <div className='flex flex-wrap items-end justify-between gap-x-4 gap-y-3 border-b'>
          <TabsList
            variant='line'
            className='-mb-px max-w-full [scrollbar-width:none] justify-start overflow-x-auto overflow-y-hidden'
          >
            {REQUEST_VIEWS.map((view) => {
              const count = data ? viewCount(view, data.counts) : null;
              return (
                <TabsTrigger key={view} value={view}>
                  {VIEW_LABELS[view]}
                  {count !== null && (
                    <span
                      className={cn(
                        'text-xs tabular-nums',
                        count > 0 && view === 'attention' && 'font-semibold text-destructive',
                        count > 0 && view === 'approval' && 'font-semibold text-warning',
                        (count === 0 || (view !== 'attention' && view !== 'approval')) &&
                          'font-normal text-muted-foreground'
                      )}
                    >
                      {count.toLocaleString('th-TH')}
                    </span>
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>
          <div className='mb-2 flex w-full items-center gap-2 sm:w-auto'>
            <div className='relative flex-1 sm:w-72 sm:flex-none'>
              <IconSearch
                aria-hidden='true'
                className='pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground'
              />
              <Input
                type='search'
                value={draft}
                onChange={(event) => {
                  setDraft(event.target.value);
                  writeQuery(event.target.value.trim());
                }}
                aria-label='ค้นหาคำขอ'
                placeholder='ชื่อร้าน, ผู้ติดต่อ, เบอร์ หรือ prefix'
                className='h-8 pl-8'
              />
            </div>
            <Freshness
              updatedAt={query.dataUpdatedAt}
              fetching={query.isFetching}
              onRefresh={() => void query.refetch()}
            />
          </div>
        </div>
      </Tabs>

      {query.isError && !data && (
        <ApiErrorPanel
          error={query.error}
          onRetry={() => void query.refetch()}
          retrying={query.isFetching}
        />
      )}
      {query.isError && data && (
        <StaleDataNotice error={query.error} updatedAt={formatClock(query.dataUpdatedAt)} />
      )}
      {query.isPending && <RequestsTableSkeleton />}
      {data && (
        <RequestsDataTable
          items={data.items}
          pageCount={Math.max(Math.ceil(data.total / data.limit), 1)}
          emptyState={
            filters.q ? (
              <>
                <p className='font-medium'>ไม่พบคำขอที่ตรงกับ “{filters.q}”</p>
                <Button
                  variant='outline'
                  size='sm'
                  className='mt-3'
                  onClick={() => {
                    setDraft('');
                    void setSearch({ q: null, page: null });
                  }}
                >
                  ล้างคำค้น
                </Button>
              </>
            ) : (
              <>
                <p className='font-medium'>{empty.title}</p>
                <p className='mt-1 text-sm whitespace-normal text-muted-foreground'>{empty.body}</p>
              </>
            )
          }
        />
      )}
    </div>
  );
}

function RequestsTableSkeleton() {
  return (
    <div className='flex flex-col gap-px overflow-hidden rounded-lg border' aria-hidden='true'>
      <Skeleton className='h-10 rounded-none' />
      {Array.from({ length: 6 }, (_, index) => (
        <Skeleton key={index} className='h-15 rounded-none opacity-60' />
      ))}
    </div>
  );
}
