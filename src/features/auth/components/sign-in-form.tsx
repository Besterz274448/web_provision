import { IconLoader2, IconTruckDelivery } from '@tabler/icons-react';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';
import { useServerFn } from '@tanstack/react-start';
import { type FormEvent, useId, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { siteConfig } from '@/config/site';
import { authKeys } from '../api/queries';
import { signIn } from '../api/service';
import { safeRedirectPath } from '../utils';

export function SignInForm({ redirectTo }: { redirectTo?: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const signInFn = useServerFn(signIn);
  const errorId = useId();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSubmitting(true);
    setError(null);
    try {
      const result = await signInFn({
        data: { username: String(form.get('username')), password: String(form.get('password')) }
      });
      if (result.error !== undefined) {
        setError(result.error);
        return;
      }
      queryClient.setQueryData(authKeys.user, result.user);
      await router.navigate({ href: safeRedirectPath(redirectTo) });
    } catch {
      setError('เข้าสู่ระบบไม่สำเร็จเพราะเซิร์ฟเวอร์มีปัญหา ลองอีกครั้ง');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className='flex min-h-svh items-center justify-center bg-sidebar p-4'>
      <div className='w-full max-w-sm rounded-xl bg-background p-6 shadow-sm sm:p-8'>
        <div className='flex items-center gap-2 text-sm font-semibold'>
          <span className='flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground'>
            <IconTruckDelivery className='size-5' aria-hidden='true' />
          </span>
          {siteConfig.name}
        </div>
        <h1 className='mt-6 text-2xl font-semibold'>เข้าสู่ระบบ</h1>

        <form className='mt-5 flex flex-col gap-4' onSubmit={(event) => void onSubmit(event)}>
          <div className='flex flex-col gap-1.5'>
            <Label htmlFor='username'>ชื่อผู้ใช้</Label>
            <Input
              id='username'
              name='username'
              required
              maxLength={64}
              autoFocus
              autoComplete='username'
              autoCapitalize='none'
              spellCheck={false}
              aria-describedby={error ? errorId : undefined}
            />
          </div>
          <div className='flex flex-col gap-1.5'>
            <Label htmlFor='password'>รหัสผ่าน</Label>
            <Input
              id='password'
              name='password'
              type='password'
              required
              maxLength={256}
              autoComplete='current-password'
              aria-describedby={error ? errorId : undefined}
            />
          </div>
          {error && (
            <p id={errorId} role='alert' className='text-sm text-destructive'>
              {error}
            </p>
          )}
          <Button type='submit' disabled={submitting} className='mt-1'>
            {submitting && (
              <IconLoader2 data-icon='inline-start' className='animate-spin' aria-hidden='true' />
            )}
            เข้าสู่ระบบ
          </Button>
        </form>

        <p className='mt-4 text-xs text-muted-foreground'>ลืมรหัสผ่านหรือยังไม่มีบัญชี ติดต่อทีมที่ดูแลระบบนี้</p>
      </div>
    </main>
  );
}
