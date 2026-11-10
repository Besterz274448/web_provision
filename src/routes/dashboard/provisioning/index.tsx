import { noop } from '@tanstack/react-query';
import { IconPlus } from '@tabler/icons-react';
import { Link, createFileRoute } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import PageContainer from '@/components/layout/page-container';
import { requestListQueryOptions } from '@/features/provisioning/api/queries';
import { RequestsTable } from '@/features/provisioning/components/requests-table';
import { getRequestFiltersFromSearch } from '@/features/provisioning/components/requests-table/search-params';

export const Route = createFileRoute('/dashboard/provisioning/')({
  head: () => ({ meta: [{ title: 'คำขอ Provisioning' }] }),
  loaderDeps: ({ search }) => search,
  // Waits so the server renders real rows. A failed fetch is left for the table to show.
  loader: ({ context: { queryClient }, deps }) =>
    queryClient.query(requestListQueryOptions(getRequestFiltersFromSearch(deps))).then(noop, noop),
  component: RequestsPage
});

function RequestsPage() {
  return (
    <PageContainer
      pageTitle='คำขอ Provisioning'
      pageDescription='อนุมัติลูกค้าจากแบบสำรวจ และติดตามการตั้ง Tenant และรถ รายการใหม่สุดอยู่บน'
      pageHeaderAction={
        <Button nativeButton={false} render={<Link to='/dashboard/provisioning/new' />}>
          <IconPlus data-icon='inline-start' aria-hidden='true' />
          ขอ Provisioning ใหม่
        </Button>
      }
    >
      <RequestsTable />
    </PageContainer>
  );
}
