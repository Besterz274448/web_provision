import { Link } from '@tanstack/react-router';

import { Button } from '@/components/ui/button';

export function NotFound() {
  return (
    <div className='mx-auto max-w-prose p-8 text-center'>
      <h1 className='text-xl font-semibold'>ไม่พบหน้านี้</h1>
      <p className='mt-1 text-sm text-muted-foreground'>ลิงก์อาจผิด กลับไปดูจากรายการคำขอได้</p>
      <Button
        variant='outline'
        size='sm'
        className='mt-4'
        nativeButton={false}
        render={<Link to='/dashboard/provisioning' />}
      >
        ไปที่รายการคำขอ
      </Button>
    </div>
  );
}
