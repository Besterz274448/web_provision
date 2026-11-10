import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import AppSidebar from '@/components/layout/app-sidebar';
import Header from '@/components/layout/header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Toaster, ToastProvider } from '@/components/ui/toast';
import { ApprovalAlerts } from '@/features/provisioning/components/approval-alerts';

export const Route = createFileRoute('/dashboard')({
  // Guard every /dashboard route. Returning the user narrows it to non-null
  // for child routes (`Route.useRouteContext()`).
  beforeLoad: ({ context, location }) => {
    if (!context.user) {
      throw redirect({ to: '/auth/sign-in', search: { redirect: location.href } });
    }
    return { user: context.user };
  },
  component: DashboardLayout
});

function DashboardLayout() {
  return (
    <SidebarProvider>
      <a
        href='#main-content'
        className='sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:shadow-md focus:ring-2 focus:ring-ring focus:outline-none'
      >
        ข้ามไปที่เนื้อหา
      </a>
      <ToastProvider>
        <AppSidebar />
        <SidebarInset id='main-content' tabIndex={-1} className='min-w-0'>
          <Header />
          <Outlet />
        </SidebarInset>
        <ApprovalAlerts />
        <Toaster />
      </ToastProvider>
    </SidebarProvider>
  );
}
