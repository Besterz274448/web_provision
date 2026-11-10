import { noop } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import PageContainer from '@/components/layout/page-container';
import {
  requestDetailQueryOptions,
  requestStepsQueryOptions
} from '@/features/provisioning/api/queries';
import { RequestDetailView } from '@/features/provisioning/components/request-detail';

export const Route = createFileRoute('/dashboard/provisioning/$id')({
  head: () => ({ meta: [{ title: 'รายละเอียดคำขอ Provisioning' }] }),
  // Waits so the server renders real data. A failed fetch is left for the page to show.
  loader: async ({ context: { queryClient }, params: { id } }) => {
    await Promise.all([
      queryClient.query(requestDetailQueryOptions(id)).catch(noop),
      queryClient.query(requestStepsQueryOptions(id)).catch(noop)
    ]);
  },
  component: RequestPage
});

function RequestPage() {
  const { id } = Route.useParams();
  return (
    <PageContainer>
      <RequestDetailView id={id} />
    </PageContainer>
  );
}
