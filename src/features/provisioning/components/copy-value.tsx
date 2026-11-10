import { IconCheck, IconCopy } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

const COPIED_MS = 1500;

/**
 * Copies text and reports the result for a moment. Someone pasting after a failed copy would send
 * whatever was on the clipboard before, so the button must be able to say that it did not work.
 */
export function useCopy() {
  const [result, setResult] = useState<'copied' | 'failed' | null>(null);

  useEffect(() => {
    if (!result) return;
    const timer = setTimeout(() => setResult(null), COPIED_MS);
    return () => clearTimeout(timer);
  }, [result]);

  const copy = (value: string) => {
    navigator.clipboard.writeText(value).then(
      () => setResult('copied'),
      () => setResult('failed')
    );
  };
  return { copied: result === 'copied', failed: result === 'failed', copy };
}

/** A value in full, wrapped rather than truncated, because people paste it elsewhere. */
export function CopyValue({ label, value }: { label: string; value: string }) {
  const { copied, copy } = useCopy();

  return (
    <span className='flex items-start gap-1'>
      <code className='min-w-0 font-mono text-xs leading-6 break-all'>{value}</code>
      <Button
        variant='ghost'
        size='icon'
        className='size-6 shrink-0'
        aria-label={copied ? `คัดลอก ${label} แล้ว` : `คัดลอก ${label}`}
        onClick={() => copy(value)}
      >
        {copied ? <IconCheck className='text-success' /> : <IconCopy />}
      </Button>
    </span>
  );
}
