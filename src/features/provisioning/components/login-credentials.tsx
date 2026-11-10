import { IconCheck, IconCopy, IconDownload, IconEye, IconEyeOff } from '@tabler/icons-react';
import { useMutation } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { API_ERROR_COPY, apiErrorCode } from '../api/errors';
import { revealCredentials } from '../api/service';
import type { Credential, RequestDetail, RevealCredentialsResult } from '../api/types';
import { credentialsText, NO_PASSWORD_TEXT } from '../lib/credentials';
import { CopyValue, useCopy } from './copy-value';

const REVEAL_ERRORS: Record<NonNullable<RevealCredentialsResult['error']>, string> = {
  not_finished: 'คำขอนี้ยังไม่เสร็จ จึงยังไม่มีข้อมูลเข้าระบบ',
  expired: 'พ้นระยะเก็บรหัสแล้ว จึงดูรหัสผ่านไม่ได้อีก'
};

const PDF_ERRORS: Record<number, string> = {
  401: 'เซสชันหมดอายุ เข้าสู่ระบบใหม่แล้วลองอีกครั้ง',
  409: REVEAL_ERRORS.not_finished,
  410: 'พ้นระยะเก็บรหัสแล้ว ดาวน์โหลดใบข้อมูลเข้าระบบไม่ได้อีก'
};

function CredentialsDownload({ id }: { id: string }) {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function download() {
    setDownloading(true);
    setError(null);
    try {
      const res = await fetch(`/api/provisioning/${encodeURIComponent(id)}/credentials`);
      if (!res.ok) {
        setError(PDF_ERRORS[res.status] ?? 'ดาวน์โหลดไม่สำเร็จ ลองอีกครั้ง');
        return;
      }
      const url = URL.createObjectURL(await res.blob());
      const link = document.createElement('a');
      link.href = url;
      link.download = `vehicle-logins-${id}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      setError('ดาวน์โหลดไม่สำเร็จ ลองอีกครั้ง');
    } finally {
      setDownloading(false);
    }
  }

  return (
    <>
      <Button variant='outline' size='sm' onClick={() => void download()} disabled={downloading}>
        <IconDownload data-icon='inline-start' aria-hidden='true' />
        ใบข้อมูลเข้าระบบ
      </Button>
      {error && (
        <span role='alert' className='w-full text-xs text-destructive'>
          {error}
        </span>
      )}
    </>
  );
}

function CopyAll({ text }: { text: string }) {
  const { copied, failed, copy } = useCopy();
  const label = copied ? 'คัดลอกแล้ว' : failed ? 'คัดลอกไม่สำเร็จ' : 'คัดลอกทั้งหมด';
  return (
    <Button size='sm' onClick={() => copy(text)} aria-live='polite'>
      {copied ? (
        <IconCheck data-icon='inline-start' aria-hidden='true' />
      ) : (
        <IconCopy data-icon='inline-start' aria-hidden='true' />
      )}
      {label}
    </Button>
  );
}

function CredentialTable({ credentials }: { credentials: Credential[] }) {
  return (
    <div className='overflow-x-auto rounded-lg border'>
      <Table>
        <TableHeader>
          <TableRow className='hover:bg-transparent'>
            <TableHead>ประเภท</TableHead>
            <TableHead>ชื่อ</TableHead>
            <TableHead>Username</TableHead>
            <TableHead>รหัสผ่าน</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {credentials.map((login) => (
            <TableRow key={login.username}>
              <TableCell className='font-medium'>{login.type}</TableCell>
              <TableCell className='whitespace-normal'>{login.name}</TableCell>
              <TableCell>
                <CopyValue label={`username ของ ${login.name}`} value={login.username} />
              </TableCell>
              <TableCell>
                {login.password ? (
                  <CopyValue label={`รหัสผ่านของ ${login.name}`} value={login.password} />
                ) : (
                  <span className='text-xs text-muted-foreground'>{NO_PASSWORD_TEXT}</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

/** What the list cannot show. A vehicle that did not finish has no login yet. */
function unfinishedVehicles(request: RequestDetail) {
  return request.vehicles.filter((vehicle) => vehicle.status !== 'completed').length;
}

/**
 * Every login of a finished request, for the team to pass on to the customer. Passwords load only
 * when a person asks, because each reveal is audited, and stay out of the query cache so they are
 * gone when the person hides them or leaves the page.
 */
export function LoginCredentials({ request }: { request: RequestDetail }) {
  const revealFn = useServerFn(revealCredentials);
  const reveal = useMutation({
    mutationFn: () => revealFn({ data: request.id }),
    gcTime: 0
  });
  const credentials = reveal.data?.credentials;
  const refusal = reveal.data?.error;
  const failure = reveal.isError ? API_ERROR_COPY[apiErrorCode(reveal.error)].title : null;
  const unfinished = unfinishedVehicles(request);

  return (
    <section aria-labelledby='logins-title' className='flex flex-col gap-3 rounded-lg border p-4'>
      <div className='flex flex-wrap items-start justify-between gap-x-6 gap-y-2'>
        <div className='min-w-0'>
          <h2 id='logins-title' className='font-semibold'>
            ข้อมูลเข้าระบบ
          </h2>
          <p className='mt-0.5 text-sm text-muted-foreground'>
            Username และรหัสผ่านของ admin, ร้านค้าตัวอย่าง และรถ สำหรับส่งให้ลูกค้า
            ทุกครั้งที่เปิดดูหรือดาวน์โหลดจะถูกบันทึก
          </p>
        </div>
        <div className='flex flex-wrap items-center gap-2'>
          {credentials ? (
            <>
              <CopyAll text={credentialsText(request.supplier_name, credentials)} />
              <Button variant='outline' size='sm' onClick={() => reveal.reset()}>
                <IconEyeOff data-icon='inline-start' aria-hidden='true' />
                ซ่อน
              </Button>
            </>
          ) : (
            <Button size='sm' onClick={() => reveal.mutate()} disabled={reveal.isPending}>
              <IconEye data-icon='inline-start' aria-hidden='true' />
              แสดงรหัสผ่าน
            </Button>
          )}
          <CredentialsDownload id={request.id} />
        </div>
      </div>
      {(refusal || failure) && (
        <p role='alert' className='text-sm text-destructive'>
          {refusal ? REVEAL_ERRORS[refusal] : failure}
        </p>
      )}
      {credentials && (
        <>
          <CredentialTable credentials={credentials} />
          {unfinished > 0 && (
            <p className='text-sm text-warning'>
              ยังไม่มีข้อมูลเข้าระบบของรถ {unfinished} คันที่สร้างไม่สำเร็จ
            </p>
          )}
        </>
      )}
    </section>
  );
}
