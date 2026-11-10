import { noop, useQuery } from '@tanstack/react-query';
import { Link, createFileRoute } from '@tanstack/react-router';
import PageContainer from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  modulesQueryOptions,
  requestDetailQueryOptions
} from '@/features/provisioning/api/queries';
import { ApiErrorPanel } from '@/features/provisioning/components/api-error';
import { NewRequestForm } from '@/features/provisioning/components/new-request-form';
import { prefilledModules, requestTitle } from '@/features/provisioning/lib/survey';

export const Route = createFileRoute('/dashboard/provisioning/$id_/approve')({
  head: () => ({ meta: [{ title: 'ตรวจและอนุมัติคำขอ' }] }),
  // Waits so the form starts filled in. A failed fetch is left for the page to show.
  loader: async ({ context: { queryClient }, params: { id } }) => {
    await Promise.all([
      queryClient.query(requestDetailQueryOptions(id)).catch(noop),
      queryClient.query(modulesQueryOptions()).then(noop, noop)
    ]);
  },
  component: ApprovePage
});

function ApprovePage() {
  const { id } = Route.useParams();
  // Only the first read matters: refreshing would not change a form someone is filling in.
  const detail = useQuery({ ...requestDetailQueryOptions(id), refetchInterval: false });
  const options = useQuery(modulesQueryOptions());
  const request = detail.data;

  if (detail.isPending || options.isPending) {
    return (
      <PageContainer>
        <Skeleton className='h-64 w-full' aria-hidden='true' />
      </PageContainer>
    );
  }
  if (!request) {
    return (
      <PageContainer>
        <ApiErrorPanel
          error={detail.error}
          onRetry={() => void detail.refetch()}
          retrying={detail.isFetching}
        />
      </PageContainer>
    );
  }
  if (request.status !== 'awaiting_approval') {
    return (
      <PageContainer pageTitle={requestTitle(request)}>
        <p className='text-sm text-muted-foreground'>คำขอนี้ได้รับการตรวจแล้ว จึงไม่ต้องอนุมัติอีก</p>
        <Button
          variant='outline'
          size='sm'
          className='mt-3 w-fit'
          nativeButton={false}
          render={<Link to='/dashboard/provisioning/$id' params={{ id }} />}
        >
          ดูคำขอ
        </Button>
      </PageContainer>
    );
  }
  // A CCPlus registration also gives the address, a free prefix and where products come from.
  const ccplus = request.source === 'ccplus';
  // A Latin name is spaced from the Thai around it.
  const from = ccplus ? ' CCPlus' : 'แบบสำรวจ';
  return (
    <PageContainer
      pageTitle={`ตรวจและอนุมัติ ${requestTitle(request)}`}
      pageDescription={`ข้อมูลจาก${from} แก้ไม่ได้ กรอกส่วนที่เหลือให้ครบและตรวจ prefix ระบบจะเริ่มตั้งทันทีที่อนุมัติ`}
    >
      <NewRequestForm
        approval={{
          requestId: request.id,
          from,
          start: ccplus
            ? {
                order_prefix: request.order_prefix,
                category: request.category,
                district: request.district,
                sub_district: request.sub_district,
                zipcode: request.zipcode,
                // 0 means no coordinates, which the form shows as empty.
                latitude: request.latitude ? String(request.latitude) : '',
                longitude: request.longitude ? String(request.longitude) : ''
              }
            : undefined,
          source:
            ccplus && request.source_supplier_id && request.source_customer_id
              ? { supplierId: request.source_supplier_id, customerId: request.source_customer_id }
              : undefined,
          existingAdminUserId:
            request.ccplus_identity && request.source_user_id ? request.source_user_id : undefined,
          supplierName: request.supplier_name,
          province: request.province,
          contactPhone: request.contact_phone,
          contactEmail: request.contact_email,
          modules: prefilledModules(request.modules, options.data?.modules ?? []),
          survey: request.survey,
          catalogBrands: request.catalog_brands ?? []
        }}
      />
    </PageContainer>
  );
}
