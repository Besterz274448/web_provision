import { IconListDetails, IconTruckDelivery } from '@tabler/icons-react';
import { Link, useLocation, useRouteContext } from '@tanstack/react-router';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail
} from '@/components/ui/sidebar';
import { siteConfig } from '@/config/site';
import { UserMenu } from '@/features/auth/components/user-menu';
import { useAwaitingApprovalCount } from '@/features/provisioning/components/approval-alerts';
import { ServiceStatus } from '@/features/provisioning/components/service-status';

const REQUESTS_PATH = '/dashboard/provisioning';

export default function AppSidebar() {
  const { pathname } = useLocation();
  const { user } = useRouteContext({ from: '/dashboard' });
  const awaiting = useAwaitingApprovalCount() ?? 0;
  const requestsLabel =
    awaiting > 0 ? `คำขอ Provisioning · รออนุมัติ ${awaiting}` : 'คำขอ Provisioning';

  return (
    <Sidebar variant='inset' collapsible='icon'>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size='lg'
              render={<Link to={REQUESTS_PATH} aria-label={siteConfig.name} />}
            >
              <div className='flex aspect-square size-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground'>
                <IconTruckDelivery className='size-5' aria-hidden='true' />
              </div>
              <div className='grid flex-1 text-left text-sm leading-tight'>
                <span className='truncate font-semibold'>{siteConfig.name}</span>
                <span className='truncate text-xs text-sidebar-foreground/80'>DMS</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className='overflow-x-hidden'>
        <SidebarGroup className='py-0'>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                render={<Link to={REQUESTS_PATH} />}
                tooltip={requestsLabel}
                aria-label={requestsLabel}
                isActive={pathname.startsWith(REQUESTS_PATH)}
              >
                <IconListDetails aria-hidden='true' />
                <span>คำขอ Provisioning</span>
                {/* A dot stands in for the count when the sidebar is down to icons. */}
                {awaiting > 0 && (
                  <span
                    aria-hidden='true'
                    className='absolute top-1.5 left-6 hidden size-2 rounded-full bg-warning group-data-[collapsible=icon]:block'
                  />
                )}
              </SidebarMenuButton>
              {awaiting > 0 && (
                <SidebarMenuBadge
                  aria-hidden='true'
                  className='bg-warning/15 font-semibold text-warning'
                >
                  {awaiting.toLocaleString('th-TH')}
                </SidebarMenuBadge>
              )}
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <ServiceStatus />
        <UserMenu username={user.username} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
