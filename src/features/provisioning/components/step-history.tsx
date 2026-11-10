import { useId, useState } from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import type { StepLog, StepStatus, Vehicle } from '../api/types';
import { formatDateTime, formatDuration } from '../lib/format';

const STEP_LABELS: Record<string, string> = {
  validate_flow_auth: 'ตรวจข้อมูลซ้ำกับ flow-auth',
  handoff_flow_api: 'ส่งงานให้ flow-api',
  write_flow_auth: 'สร้าง Login ใน flow-auth',
  write_dms: 'เขียน DMS',
  write_r9: 'เขียน R9',
  write_vehicle_dms: 'ตั้งรถใน DMS',
  write_catalog: 'สร้างสินค้าตั้งต้น'
};

const STATUS_COPY: Record<StepStatus, { label: string; className: string }> = {
  succeeded: { label: 'สำเร็จ', className: 'text-success' },
  skipped: { label: 'ข้าม มีข้อมูลแล้ว', className: 'text-muted-foreground' },
  failed: { label: 'ล้ม', className: 'text-destructive' },
  rolled_back: { label: 'ล้ม ย้อนกลับแล้ว', className: 'text-destructive' },
  executed: { label: 'รัน รอ commit', className: 'text-muted-foreground' }
};

/** Sub-steps run inside a transaction. Their failures always show, the rest only on request. */
const isDetailStep = (step: StepLog) => step.status === 'executed';

function StepRows({ step, vehicleCode }: { step: StepLog; vehicleCode?: string }) {
  const copy = STATUS_COPY[step.status];
  const label = STEP_LABELS[step.step];
  return (
    <>
      <TableRow className={cn(step.error_code && 'border-b-0')}>
        <TableCell>
          {label ? (
            <span className='font-medium'>{label}</span>
          ) : (
            <code className='font-mono text-xs'>{step.step}</code>
          )}
          {vehicleCode && (
            <code className='ml-2 font-mono text-xs text-muted-foreground'>{vehicleCode}</code>
          )}
        </TableCell>
        <TableCell className={cn('font-medium', copy.className)}>{copy.label}</TableCell>
        <TableCell className='text-right tabular-nums'>{step.rows_affected ?? '–'}</TableCell>
        <TableCell className='text-right tabular-nums'>
          {step.status === 'skipped' ? '–' : formatDuration(step.duration_ms)}
        </TableCell>
        <TableCell className='text-right tabular-nums'>{formatDateTime(step.started_at)}</TableCell>
      </TableRow>
      {step.error_code && (
        <TableRow className='hover:bg-transparent'>
          <TableCell colSpan={5} className='pt-0 whitespace-normal'>
            <code className='font-mono text-xs font-medium text-destructive'>
              {step.error_code}
            </code>
            <p className='text-xs break-words text-muted-foreground'>{step.error_message}</p>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

export function StepHistory({ steps, vehicles }: { steps: StepLog[]; vehicles: Vehicle[] }) {
  const switchId = useId();
  const [showDetail, setShowDetail] = useState(false);
  const detailCount = steps.filter(isDetailStep).length;
  const vehicleCodes = new Map(vehicles.map((v) => [v.id, v.van_code]));

  const visible = showDetail ? steps : steps.filter((step) => !isDetailStep(step));
  const attempts = [...new Set(visible.map((step) => step.attempt))].toSorted((a, b) => b - a);

  return (
    <section aria-labelledby={`${switchId}-title`}>
      <div className='mb-2 flex flex-wrap items-center justify-between gap-2'>
        <h2 id={`${switchId}-title`} className='font-semibold'>
          ประวัติการทำงาน
        </h2>
        {detailCount > 0 && (
          <div className='flex items-center gap-2'>
            <Switch id={switchId} checked={showDetail} onCheckedChange={setShowDetail} />
            <Label htmlFor={switchId} className='text-xs font-normal text-muted-foreground'>
              แสดงคำสั่งย่อย {detailCount} รายการ
            </Label>
          </div>
        )}
      </div>

      {attempts.length === 0 ? (
        <p className='rounded-lg border px-4 py-6 text-center text-sm text-muted-foreground'>
          ยังไม่มีประวัติ Worker จะบันทึกทุกขั้นตอนเมื่อเริ่มทำคำขอนี้
        </p>
      ) : (
        <div className='overflow-hidden rounded-lg border'>
          <Table>
            <TableHeader>
              <TableRow className='hover:bg-transparent'>
                <TableHead>ขั้นตอน</TableHead>
                <TableHead>ผล</TableHead>
                <TableHead className='text-right'>แถว</TableHead>
                <TableHead className='text-right'>ใช้เวลา</TableHead>
                <TableHead className='text-right'>เริ่มเมื่อ</TableHead>
              </TableRow>
            </TableHeader>
            {attempts.map((attempt) => (
              <TableBody key={attempt}>
                <TableRow className='bg-muted/60 hover:bg-muted/60'>
                  <TableCell colSpan={5} className='py-1.5 text-xs font-semibold'>
                    ครั้งที่ {attempt}
                  </TableCell>
                </TableRow>
                {visible
                  .filter((step) => step.attempt === attempt)
                  .map((step) => (
                    <StepRows
                      key={step.id}
                      step={step}
                      vehicleCode={
                        step.vehicle_request_id
                          ? vehicleCodes.get(step.vehicle_request_id)
                          : undefined
                      }
                    />
                  ))}
              </TableBody>
            ))}
          </Table>
        </div>
      )}
    </section>
  );
}
