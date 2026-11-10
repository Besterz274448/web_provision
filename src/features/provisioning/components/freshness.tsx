import { IconRefresh } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { formatClock } from '../lib/format';

export function Freshness({
  updatedAt,
  fetching,
  onRefresh
}: {
  updatedAt: number;
  fetching: boolean;
  onRefresh: () => void;
}) {
  return (
    <div className='flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground'>
      {updatedAt > 0 && <span className='tabular-nums'>อัปเดต {formatClock(updatedAt)}</span>}
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant='ghost'
              size='icon'
              className='size-8'
              onClick={onRefresh}
              disabled={fetching}
              aria-label='รีเฟรชตอนนี้'
            />
          }
        >
          <IconRefresh className={cn(fetching && 'animate-spin')} />
        </TooltipTrigger>
        <TooltipContent>รีเฟรชตอนนี้ (หน้านี้รีเฟรชเองอยู่แล้ว)</TooltipContent>
      </Tooltip>
    </div>
  );
}
