import { IconBrightness } from '@tabler/icons-react';
import { useTheme } from 'next-themes';

import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export function ThemeModeToggle() {
  const { setTheme, resolvedTheme } = useTheme();

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant='ghost'
            size='icon'
            className='size-8'
            aria-label='สลับโหมดสว่างและมืด'
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
          />
        }
      >
        <IconBrightness />
      </TooltipTrigger>
      <TooltipContent>สลับโหมดสว่างและมืด</TooltipContent>
    </Tooltip>
  );
}
