import { useEffect, useTransition } from 'react';
import { type ErrorComponentProps, useRouter } from '@tanstack/react-router';

import { Button } from '@/components/ui/button';

/**
 * Default error UI for routes below the root. Renders inside the dashboard
 * layout (sidebar and header stay usable) with a retry that re-runs loaders.
 */
export function RouteError({ error, reset }: ErrorComponentProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    console.error(error);
  }, [error]);

  const retry = () => {
    startTransition(async () => {
      await router.invalidate();
      reset();
    });
  };

  return (
    <div role='alert' className='mx-auto max-w-prose p-8 text-center'>
      <h1 className='text-xl font-semibold'>หน้านี้แสดงผลไม่ได้</h1>
      <p className='mt-1 text-sm text-muted-foreground'>
        ลองโหลดใหม่ ถ้ายังไม่ได้ให้ดูรายละเอียดใน console ของเบราว์เซอร์
      </p>
      <Button variant='outline' size='sm' className='mt-4' onClick={retry} disabled={isPending}>
        ลองอีกครั้ง
      </Button>
    </div>
  );
}
