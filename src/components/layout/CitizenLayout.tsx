import React, { ReactNode } from 'react';
import { Bell, User, Shield, LogOut, Settings, Phone, CircleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface CitizenLayoutProps {
  children: ReactNode;
  title?: string;
  showHeader?: boolean;
}

export function CitizenLayout({ children, title = 'SAHELI', showHeader = true }: CitizenLayoutProps) {
  const { user, logout } = useAuth();

  return (
    <SidebarProvider>
      <AppSidebar />
      <div className="min-h-screen bg-background flex flex-col w-full">
        {showHeader && (
          <header className="bg-gradient-coral text-header-foreground px-4 py-3 flex items-center justify-between sticky top-0 z-50">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="text-white hover:bg-white/20 hover:text-white" />
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                <span className="font-bold text-lg">{title}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm font-medium hidden sm:block">
                Hello {user?.name?.split(' ')[0] || 'User'}
              </span>

              {/* Notification Popover */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="header-icon" size="icon-sm" className="rounded-full relative">
                    <Bell className="h-5 w-5" />
                    <span className="absolute -top-1 -right-1 h-4 w-4 bg-destructive rounded-full text-[10px] flex items-center justify-center font-bold">
                      2
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80" align="end">
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <h4 className="font-medium leading-none">Notifications</h4>
                      <p className="text-sm text-muted-foreground">You have 2 unread messages.</p>
                    </div>
                    <div className="grid gap-2">
                      <div className="grid grid-cols-[25px_1fr] items-start pb-4 last:mb-0 last:pb-0">
                        <span className="flex h-2 w-2 translate-y-1 rounded-full bg-sky-500" />
                        <div className="space-y-1">
                          <p className="text-sm font-medium leading-none">New Feature: 24/7 Transport</p>
                          <p className="text-sm text-muted-foreground">Book verified cabs instantly!</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-[25px_1fr] items-start pb-4 last:mb-0 last:pb-0">
                        <span className="flex h-2 w-2 translate-y-1 rounded-full bg-green-500" />
                        <div className="space-y-1">
                          <p className="text-sm font-medium leading-none">SOS Alert Resolved</p>
                          <p className="text-sm text-muted-foreground">You are marked safe.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              {/* Profile Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="header-icon" size="icon-sm" className="rounded-full">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => window.location.href = '/profile'}>
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => window.location.href = '/settings'}>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => window.location.href = '/helpline'}>
                    <Phone className="mr-2 h-4 w-4" />
                    <span>Helpline</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-red-500 focus:text-red-600 focus:bg-red-50" onClick={logout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
        )}

        <main className="flex-1 flex flex-col">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
