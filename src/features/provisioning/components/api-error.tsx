import { IconPlugConnectedX, IconRefresh } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { API_ERROR_COPY, apiErrorCode } from '../api/errors';

export function ApiErrorPanel({
  error,
  onRetry,
  retrying
}: {
  error: unknown;
  onRetry: () => void;
  retrying?: boolean;
}) {
  const copy = API_ERROR_COPY[apiErrorCode(error)];
  return (
    <div role='alert' className='rounded-lg border px-6 py-10 text-center'>
      <IconPlugConnectedX aria-hidden='true' className='mx-auto size-6 text-destructive' />
      <h2 className='mt-3 font-semibold'>{copy.title}</h2>
      <p className='mx-auto mt-1 max-w-prose text-sm text-muted-foreground'>{copy.body}</p>
      <Button variant='outline' size='sm' className='mt-4' onClick={onRetry} disabled={retrying}>
        <IconRefresh data-icon='inline-start' className={retrying ? 'animate-spin' : undefined} />
        ลองอีกครั้ง
      </Button>
    </div>
  );
}

/** Shown above data that stopped refreshing, so an old screen is never mistaken for a live one. */
export function StaleDataNotice({ error, updatedAt }: { error: unknown; updatedAt: string }) {
  const copy = API_ERROR_COPY[apiErrorCode(error)];
  return (
    <p
      role='status'
      className='rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-sm text-warning'
    >
      {copy.title} ข้อมูลด้านล่างเป็นของเวลา {updatedAt} และอาจไม่ตรงกับปัจจุบัน
    </p>
  );
}
