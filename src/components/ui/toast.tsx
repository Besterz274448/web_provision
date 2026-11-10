import { Toast } from '@base-ui/react/toast';
import { IconX } from '@tabler/icons-react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export const ToastProvider = Toast.Provider;
export const useToastManager = Toast.useToastManager;

/** Where toasts show: bottom right, newest at the bottom. */
export function Toaster() {
  const { toasts } = Toast.useToastManager();
  return (
    <Toast.Portal>
      <Toast.Viewport className='fixed right-4 bottom-4 z-50 flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2 outline-none'>
        {toasts.map((toast) => (
          <Toast.Root
            key={toast.id}
            toast={toast}
            swipeDirection={['right', 'down']}
            className='relative rounded-lg border bg-popover p-4 pr-10 text-popover-foreground shadow-lg transition-[opacity,translate] duration-200 data-ending-style:translate-y-2 data-ending-style:opacity-0 data-starting-style:translate-y-2 data-starting-style:opacity-0'
          >
            <Toast.Content className='flex flex-col gap-1'>
              <Toast.Title className='text-sm font-semibold' />
              <Toast.Description className='text-sm text-muted-foreground' />
              {toast.actionProps && (
                <Toast.Action className={cn(buttonVariants({ size: 'sm' }), 'mt-2 self-start')} />
              )}
              <Toast.Close
                aria-label='ปิด'
                className={cn(
                  buttonVariants({ variant: 'ghost', size: 'icon-sm' }),
                  'absolute top-2 right-2'
                )}
              >
                <IconX className='size-4' aria-hidden='true' />
              </Toast.Close>
            </Toast.Content>
          </Toast.Root>
        ))}
      </Toast.Viewport>
    </Toast.Portal>
  );
}
