import { IconBan, IconRefresh, IconUserCheck } from '@tabler/icons-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { useServerFn } from '@tanstack/react-start';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { API_ERROR_COPY, apiErrorCode } from '../api/errors';
import { provisioningKeys } from '../api/queries';
import { declineRequest, retryRequest } from '../api/service';
import type { RequestDetail, RequestStatus } from '../api/types';

const RETRYABLE: RequestStatus[] = ['failed', 'rejected', 'stalled', 'completed_with_errors'];

const CONFIRM_COPY: Partial<Record<RequestStatus, string>> = {
  rejected: 'คำขอนี้ถูกปฏิเสธเพราะข้อมูล ถ้ายังไม่ได้แก้แถวข้อมูลและเขียนรหัส admin ใหม่ การลองใหม่จะล้มอีกครั้ง',
  stalled: 'ระบบจะส่งงานให้ flow-api อีกครั้ง ถ้า flow-api ยังทำงานเดิมอยู่จะข้ามส่วนที่สร้างแล้ว',
  failed: 'ระบบจะเริ่มนับจำนวนครั้งใหม่ และข้ามส่วนที่สร้างสำเร็จแล้ว',
  completed_with_errors: 'ระบบจะทำเฉพาะรถและสินค้าที่ยังไม่สำเร็จ ส่วนที่สำเร็จแล้วไม่เปลี่ยน'
};

function RetryControl({ request }: { request: RequestDetail }) {
  const queryClient = useQueryClient();
  const retryFn = useServerFn(retryRequest);
  const [confirming, setConfirming] = useState(false);
  const retry = useMutation({
    mutationFn: () => retryFn({ data: request.id }),
    onSuccess: (result) => {
      if (result.error === undefined) {
        setConfirming(false);
        void queryClient.invalidateQueries({ queryKey: provisioningKeys.all });
      }
    }
  });
  const refusal = retry.data?.error;
  const failure = retry.isError ? API_ERROR_COPY[apiErrorCode(retry.error)].title : null;

  if (!confirming) {
    return (
      <Button variant='outline' size='sm' onClick={() => setConfirming(true)}>
        <IconRefresh data-icon='inline-start' aria-hidden='true' />
        ลองใหม่
      </Button>
    );
  }
  return (
    <div className='w-full rounded-lg border bg-muted p-3'>
      <p className='text-sm'>{CONFIRM_COPY[request.status]}</p>
      {(refusal || failure) && (
        <p role='alert' className='mt-1 text-sm text-destructive'>
          {refusal ? 'API ไม่รับการลองใหม่: สถานะของคำขออาจเปลี่ยนแล้ว' : failure}
        </p>
      )}
      <div className='mt-2 flex flex-wrap gap-2'>
        <Button size='sm' onClick={() => retry.mutate()} disabled={retry.isPending}>
          ยืนยันลองใหม่
        </Button>
        <Button
          variant='ghost'
          size='sm'
          onClick={() => {
            retry.reset();
            setConfirming(false);
          }}
          disabled={retry.isPending}
        >
          ยกเลิก
        </Button>
      </div>
    </div>
  );
}

/** Approving needs the rest of the tenant's data, so it opens a form. Declining happens here. */
function ReviewControl({ request }: { request: RequestDetail }) {
  const queryClient = useQueryClient();
  const declineFn = useServerFn(declineRequest);
  const [declining, setDeclining] = useState(false);
  const [reason, setReason] = useState('');
  const decline = useMutation({
    mutationFn: () => declineFn({ data: { id: request.id, reason } }),
    onSuccess: (result) => {
      if (result.error === undefined) {
        setDeclining(false);
        void queryClient.invalidateQueries({ queryKey: provisioningKeys.all });
      }
    }
  });
  const refusal = decline.data?.error;
  const failure = decline.isError ? API_ERROR_COPY[apiErrorCode(decline.error)].title : null;

  if (!declining) {
    return (
      <>
        <Button
          size='sm'
          nativeButton={false}
          render={<Link to='/dashboard/provisioning/$id/approve' params={{ id: request.id }} />}
        >
          <IconUserCheck data-icon='inline-start' aria-hidden='true' />
          ตรวจและอนุมัติ
        </Button>
        <Button variant='outline' size='sm' onClick={() => setDeclining(true)}>
          <IconBan data-icon='inline-start' aria-hidden='true' />
          ไม่อนุมัติ
        </Button>
      </>
    );
  }
  return (
    <div className='w-full rounded-lg border bg-muted p-3'>
      <p className='text-sm'>ระบบจะไม่สร้าง Tenant ให้คำขอนี้ ข้อมูลยังเก็บไว้ แต่กลับมาอนุมัติภายหลังไม่ได้</p>
      <label htmlFor='decline-reason' className='mt-2 block text-xs text-muted-foreground'>
        เหตุผล ไม่บังคับ
      </label>
      <textarea
        id='decline-reason'
        rows={2}
        maxLength={512}
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        className='mt-1 w-full rounded-lg border border-input bg-background px-2.5 py-1.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50'
      />
      {(refusal || failure) && (
        <p role='alert' className='mt-1 text-sm text-destructive'>
          {refusal ? 'API ไม่รับคำขอนี้: สถานะของคำขออาจเปลี่ยนแล้ว' : failure}
        </p>
      )}
      <div className='mt-2 flex flex-wrap gap-2'>
        <Button
          variant='destructive'
          size='sm'
          onClick={() => decline.mutate()}
          disabled={decline.isPending}
        >
          ยืนยันไม่อนุมัติ
        </Button>
        <Button
          variant='ghost'
          size='sm'
          onClick={() => {
            decline.reset();
            setDeclining(false);
          }}
          disabled={decline.isPending}
        >
          ยกเลิก
        </Button>
      </div>
    </div>
  );
}

export function RequestActions({ request }: { request: RequestDetail }) {
  if (request.status === 'awaiting_approval') {
    return (
      <div className='flex flex-wrap items-start gap-3'>
        <ReviewControl request={request} />
      </div>
    );
  }
  if (!RETRYABLE.includes(request.status)) return null;
  if (!request.can_retry) {
    return (
      <p className='text-sm text-muted-foreground'>
        ลองใหม่ไม่ได้ เพราะรหัส admin ถูกลบไปแล้ว (ตอนคำขอถูกปฏิเสธ หรือเก็บไว้เกินกำหนด) ให้สร้างคำขอใหม่แทน
      </p>
    );
  }
  return (
    <div className='flex flex-wrap items-start gap-3'>
      <RetryControl request={request} />
    </div>
  );
}
