import { noop } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import PageContainer from '@/components/layout/page-container';
import { modulesQueryOptions } from '@/features/provisioning/api/queries';
import { NewRequestForm } from '@/features/provisioning/components/new-request-form';

export const Route = createFileRoute('/dashboard/provisioning/new')({
  head: () => ({ meta: [{ title: 'ขอ Provisioning ใหม่' }] }),
  // Waits so the module list is on the first render. A failed fetch is left for the form to show.
  loader: ({ context: { queryClient } }) =>
    queryClient.query(modulesQueryOptions()).then(noop, noop),
  component: NewRequestPage
});

function NewRequestPage() {
  return (
    <PageContainer
      pageTitle='ขอ Provisioning ใหม่'
      pageDescription='กรอกข้อมูลลูกค้า แล้วระบบจะตั้ง Tenant ให้ทันทีหลังยืนยัน'
    >
      <NewRequestForm />
    </PageContainer>
  );
}
