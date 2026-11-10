import { createFileRoute } from '@tanstack/react-router';
import { SignInForm } from '@/features/auth/components/sign-in-form';

export const Route = createFileRoute('/auth/sign-in')({
  head: () => ({ meta: [{ title: 'เข้าสู่ระบบ' }] }),
  component: SignInPage
});

function SignInPage() {
  const { redirect } = Route.useSearch();
  return <SignInForm redirectTo={redirect} />;
}
