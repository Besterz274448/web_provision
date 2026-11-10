import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  modulesQueryOptions,
  requestDetailQueryOptions,
  requestStepsQueryOptions
} from '../api/queries';
import type { RequestDetail as Request, StepLog } from '../api/types';
import { formatClock, formatDateTime, formatDuration, timeUntil, useNow } from '../lib/format';
import { describeBrands } from '../lib/catalog-selection';
import { countVehicles } from '../lib/progress';
import { displayStatus, isBeforeProvisioning } from '../lib/status';
import { requestTitle } from '../lib/survey';
import { ApiErrorPanel, StaleDataNotice } from './api-error';
import { CopyValue } from './copy-value';
import { Freshness } from './freshness';
import { LoginCredentials } from './login-credentials';
import { PipelineStages } from './pipeline-track';
import { RequestActions } from './request-actions';
import { StatusLabel } from './status-label';
import { StepHistory } from './step-history';
import { ThaiBevTag } from './thaibev-tag';
import { ShopRegistrationDetails } from './shop-registration-info';
import { SurveyAnswers } from './survey-answers';
import { VehicleTable } from './vehicle-table';

/** What the status means for the person looking at it, as the service README defines it. */
function nextStep(request: Request, failedVehicles: number, now: number | null) {
  switch (request.status) {
    case 'rejected':
      return 'ยังไม่มีการเขียนข้อมูล Tenant ส่งคำขอใหม่ด้วยข้อมูลที่ถูกต้อง หรือแก้แถวคำขอและเขียน admin_password_enc ใหม่ก่อนลองใหม่';
    case 'stalled':
      return 'flow-api ไม่ตอบกลับ ถ้าตอบกลับมาทีหลังระบบจะทำต่อเอง หรือตรวจสอบ flow-api แล้วกดลองใหม่';
    case 'failed':
      return 'ระบบลองครบจำนวนแล้วและจะไม่ลองเอง ตรวจสาเหตุแล้วกดลองใหม่';
    case 'completed_with_errors':
      return failedVehicles > 0
        ? `Tenant เข้าใช้งานได้แล้ว แต่รถ ${failedVehicles} คันล้ม รถคันอื่นไม่ได้รับผลกระทบ`
        : 'Tenant เข้าใช้งานได้แล้ว แต่สร้างสินค้าตั้งต้นไม่สำเร็จ กดลองใหม่เพื่อทำเฉพาะส่วนที่เหลือ';
    case 'pending':
      if (!request.next_attempt_at || now === null) return 'ระบบจะลองใหม่เอง';
      return `ระบบจะลองใหม่เอง ${timeUntil(request.next_attempt_at, now)}`;
    default:
      return null;
  }
}

function ProblemPanel({ request }: { request: Request }) {
  const now = useNow();
  const failedVehicles = countVehicles(request.vehicles).failed;
  const hasProblem =
    request.last_error_code || failedVehicles > 0 || request.status === 'completed_with_errors';
  if (!hasProblem) return null;
  // Failed, rejected and stalled need a person. The rest is partly done or still retrying by itself.
  const final =
    request.status === 'failed' || request.status === 'rejected' || request.status === 'stalled';
  return (
    <section
      role={final ? 'alert' : 'status'}
      className={cn(
        'rounded-lg border p-4',
        final ? 'border-destructive/30 bg-destructive/5' : 'border-warning/40 bg-warning/5'
      )}
    >
      {request.last_error_code && (
        <>
          <code
            className={cn(
              'font-mono text-sm font-medium',
              final ? 'text-destructive' : 'text-warning'
            )}
          >
            {request.last_error_code}
          </code>
          <p className='mt-1 text-sm break-words'>{request.last_error_message}</p>
        </>
      )}
      <p className='mt-1 text-sm text-muted-foreground first:mt-0'>
        {nextStep(request, failedVehicles, now)}
      </p>
    </section>
  );
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className='flex flex-col gap-0.5 border-b py-2 last:border-b-0'>
      <dt className='text-xs text-muted-foreground'>{label}</dt>
      <dd className='text-sm'>{children}</dd>
    </div>
  );
}

function erpText(request: Request) {
  if (!request.has_erp) return 'ไม่มี';
  const activation =
    request.erp_activation_status === 'pending_activation' ? 'รอ ERP Activation' : null;
  return [request.erp_name ?? 'มี', activation].filter(Boolean).join(' · ');
}

function catalogText(request: Request) {
  switch (request.catalog_status) {
    case 'pending':
      return 'รอผลจาก flow-api';
    case 'completed': {
      const skipped = Object.values(request.catalog_skipped ?? {}).reduce((a, b) => a + b, 0);
      const created = `สร้าง ${request.catalog_inserted ?? 0} จากที่พบ ${request.catalog_found ?? 0} รายการ`;
      return skipped > 0 ? `${created} · ข้าม ${skipped} รายการที่ข้อมูลไม่ครบ` : created;
    }
    case 'empty':
      return 'ไม่พบสินค้าที่ข้อมูลครบ Tenant ยังใช้งานได้';
    case 'failed':
      return (
        <>
          <code className='font-mono text-xs font-medium text-destructive'>
            {request.catalog_error_code}
          </code>
          <span className='block text-xs break-words text-muted-foreground'>
            {request.catalog_error_message}
          </span>
        </>
      );
    default:
      return null;
  }
}

function RequestFacts({ request }: { request: Request }) {
  const finishedAt = request.completed_at;
  const { data: catalog } = useQuery(modulesQueryOptions());
  const moduleNames = (request.modules ?? []).map(
    (code) => catalog?.modules.find((module) => module.code === code)?.name ?? code
  );
  const catalogSummary = catalogText(request);
  const notStarted = isBeforeProvisioning(request.status);
  return (
    <aside aria-label='ข้อมูลคำขอ'>
      <dl className='rounded-lg border px-4 py-1'>
        <Fact label='รหัสคำขอ'>
          <CopyValue label='รหัสคำขอ' value={request.id} />
        </Fact>
        {request.supplier_id && (
          <Fact label='Supplier ID'>
            <CopyValue label='Supplier ID' value={request.supplier_id} />
          </Fact>
        )}
        {request.trace_id && (
          <Fact label='Trace ID'>
            <CopyValue label='Trace ID' value={request.trace_id} />
          </Fact>
        )}
        {request.contact_phone && (
          <Fact label='เบอร์โทร'>
            <a
              className='tabular-nums underline-offset-4 hover:underline'
              href={`tel:${request.contact_phone.replace(/[ -]/g, '')}`}
            >
              {request.contact_phone}
            </a>
          </Fact>
        )}
        {request.contact_email && (
          <Fact label='อีเมล'>
            <a
              className='break-all underline-offset-4 hover:underline'
              href={`mailto:${request.contact_email}`}
            >
              {request.contact_email}
            </a>
          </Fact>
        )}
        {request.category && (
          <Fact label='ประเภท'>
            <code className='font-mono text-xs'>{request.category}</code>
          </Fact>
        )}
        {moduleNames.length > 0 && <Fact label='Module'>{moduleNames.join(', ')}</Fact>}
        {!notStarted && <Fact label='ERP'>{erpText(request)}</Fact>}
        {catalogSummary && <Fact label='สินค้าตั้งต้น'>{catalogSummary}</Fact>}
        {request.catalog_brands && request.catalog_brands.length > 0 && (
          <Fact label='แบรนด์สินค้าตั้งต้น'>{describeBrands(request.catalog_brands)}</Fact>
        )}
        {!notStarted && (
          <Fact label='จำนวนครั้งที่ทำ'>
            {request.attempt_count} ครั้ง
            {request.trigger_source && (
              <span className='text-muted-foreground'>
                {' '}
                · ล่าสุดเริ่มจาก <code className='font-mono text-xs'>{request.trigger_source}</code>
              </span>
            )}
          </Fact>
        )}
        {request.reviewed_by && request.reviewed_at && (
          <Fact label={request.status === 'declined' ? 'ไม่อนุมัติโดย' : 'อนุมัติโดย'}>
            {request.reviewed_by}
            <span className='text-muted-foreground'>
              {' '}
              · <span className='tabular-nums'>{formatDateTime(request.reviewed_at)}</span>
            </span>
          </Fact>
        )}
        {request.decline_reason && <Fact label='เหตุผล'>{request.decline_reason}</Fact>}
        <Fact label='ส่งคำขอเมื่อ'>
          <span className='tabular-nums'>{formatDateTime(request.requested_at)}</span>
        </Fact>
        {request.started_at && (
          <Fact label='เริ่มทำเมื่อ'>
            <span className='tabular-nums'>{formatDateTime(request.started_at)}</span>
          </Fact>
        )}
        {request.tenant_completed_at && (
          <Fact label='Tenant เสร็จเมื่อ'>
            <span className='tabular-nums'>{formatDateTime(request.tenant_completed_at)}</span>
          </Fact>
        )}
        {finishedAt && (
          <Fact label='จบเมื่อ'>
            <span className='tabular-nums'>{formatDateTime(finishedAt)}</span>
            <span className='text-muted-foreground'>
              {' '}
              · รวม{' '}
              {formatDuration(
                new Date(finishedAt).getTime() - new Date(request.requested_at).getTime()
              )}
            </span>
          </Fact>
        )}
      </dl>
    </aside>
  );
}

/**
 * How long each stage took when it succeeded. handoff_flow_api is left out: it only times sending
 * the request, and would read as though flow-api built the tenant in a few milliseconds.
 */
function stageDurations(steps: StepLog[]) {
  const durations: Record<string, string> = {};
  for (const step of steps) {
    if (step.status === 'succeeded' && step.step !== 'handoff_flow_api') {
      durations[step.step] = formatDuration(step.duration_ms);
    }
  }
  return durations;
}

export function RequestDetailView({ id }: { id: string }) {
  const detail = useQuery(requestDetailQueryOptions(id));
  const steps = useQuery(requestStepsQueryOptions(id));
  const request = detail.data;

  if (detail.isPending) return <RequestDetailSkeleton />;
  if (!request) {
    return (
      <ApiErrorPanel
        error={detail.error}
        onRetry={() => void detail.refetch()}
        retrying={detail.isFetching}
      />
    );
  }

  const stepList = steps.data?.steps ?? [];
  const notStarted = isBeforeProvisioning(request.status);
  return (
    <div className='flex flex-col gap-6'>
      <header className='flex flex-wrap items-start justify-between gap-x-6 gap-y-2'>
        <div className='min-w-0'>
          <h1 className='text-2xl font-semibold break-words'>{requestTitle(request)}</h1>
          <p className='mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground'>
            <StatusLabel status={displayStatus(request)} />
            {request.survey?.thaibev_staff && <ThaiBevTag />}
            <span>
              {request.order_prefix && (
                <>
                  <code className='font-mono'>{request.order_prefix}</code> ·{' '}
                </>
              )}
              {request.province}
            </span>
          </p>
        </div>
        <Freshness
          updatedAt={detail.dataUpdatedAt}
          fetching={detail.isFetching}
          onRefresh={() => {
            void detail.refetch();
            void steps.refetch();
          }}
        />
      </header>

      <RequestActions request={request} />

      {detail.isError && (
        <StaleDataNotice error={detail.error} updatedAt={formatClock(detail.dataUpdatedAt)} />
      )}

      {!notStarted && (
        <PipelineStages
          request={{ ...request, vehicles: countVehicles(request.vehicles) }}
          stageDetails={stageDurations(stepList)}
        />
      )}

      <ProblemPanel request={request} />

      {/* A retry can add logins, so a finish time of its own starts with the passwords hidden. */}
      {(request.status === 'completed' || request.status === 'completed_with_errors') && (
        <LoginCredentials key={request.completed_at} request={request} />
      )}

      <div className='grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]'>
        <div className='flex min-w-0 flex-col gap-6'>
          {notStarted && request.survey && <SurveyAnswers survey={request.survey} />}
          {notStarted && request.shop_registration && (
            <ShopRegistrationDetails registration={request.shop_registration} />
          )}
          {!notStarted && (
            <>
              <section aria-labelledby='vehicles-title'>
                <h2 id='vehicles-title' className='mb-2 font-semibold'>
                  รถ {request.vehicles.length} คัน
                </h2>
                {request.vehicles.length > 0 ? (
                  <VehicleTable vehicles={request.vehicles} />
                ) : (
                  <p className='rounded-lg border px-4 py-6 text-center text-sm text-muted-foreground'>
                    คำขอนี้ไม่มีรถ
                  </p>
                )}
              </section>
              {steps.isError ? (
                <ApiErrorPanel
                  error={steps.error}
                  onRetry={() => void steps.refetch()}
                  retrying={steps.isFetching}
                />
              ) : (
                <StepHistory steps={stepList} vehicles={request.vehicles} />
              )}
              {request.survey && <SurveyAnswers survey={request.survey} />}
              {request.shop_registration && (
                <ShopRegistrationDetails registration={request.shop_registration} />
              )}
            </>
          )}
        </div>
        <RequestFacts request={request} />
      </div>
    </div>
  );
}

function RequestDetailSkeleton() {
  return (
    <div className='flex flex-col gap-6' aria-hidden='true'>
      <Skeleton className='h-14 w-80 max-w-full' />
      <Skeleton className='h-16 w-full' />
      <Skeleton className='h-64 w-full' />
    </div>
  );
}
