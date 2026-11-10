import { cn } from '@/lib/utils';

/** Marks a survey request from a ThaiBev employee. The service declines these on arrival. */
export function ThaiBevTag({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex h-4.5 items-center rounded-sm bg-destructive/10 px-1.5 text-xs font-medium whitespace-nowrap text-destructive',
        className
      )}
    >
      พนักงานไทยเบฟ
    </span>
  );
}
