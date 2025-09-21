
'use client';

import React from 'react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarInset,
} from '@/components/ui/sidebar';
import { LogOut, User, Settings, LayoutDashboard } from 'lucide-react';
import Logo from './logo';
import { useTracking } from '@/contexts/TrackingContext';
import { useRouter, usePathname } from 'next/navigation';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { setTrackingState } = useTracking();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = () => {
    setTrackingState('not-authenticated');
    router.push('/login');
  };

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <Logo />
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton href="/" isActive={pathname === '/'} tooltip="Dashboard">
                <LayoutDashboard />
                Dashboard
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton href="/profile" isActive={pathname === '/profile'} tooltip="Profile">
                <User />
                Profile
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton href="/settings" isActive={pathname === '/settings'} tooltip="Settings">
                <Settings />
                Settings
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={handleLogout} tooltip="Logout">
                <LogOut />
                Logout
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <div className="min-h-screen bg-background text-foreground">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
