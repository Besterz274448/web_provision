import { IconLogout } from '@tabler/icons-react';
import { useState } from 'react';
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { useSignOut } from '../hooks/use-sign-out';

export function UserMenu({ username }: { username: string }) {
  const signOut = useSignOut();
  const [signingOut, setSigningOut] = useState(false);

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          tooltip={`ออกจากระบบ (${username})`}
          disabled={signingOut}
          onClick={() => {
            setSigningOut(true);
            void signOut().catch(() => setSigningOut(false));
          }}
        >
          <IconLogout aria-hidden='true' />
          <span>ออกจากระบบ</span>
          <span className='ml-auto min-w-0 truncate text-xs text-sidebar-foreground/80'>
            {username}
          </span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
