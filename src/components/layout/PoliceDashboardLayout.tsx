import React, { ReactNode, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  AlertTriangle,
  FileText,
  Users,
  Settings,
  LogOut,
  Shield,
  Menu,
  X,
  Bell
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useSOS } from '@/contexts/SOSContext';
import { cn } from '@/lib/utils';

interface PoliceDashboardLayoutProps {
  children: ReactNode;
}

const navItems = [
  { path: '/police', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { path: '/police/alerts', icon: AlertTriangle, label: 'Active Alerts' },
  { path: '/police/reports', icon: FileText, label: 'Community Reports' },
  { path: '/police/officers', icon: Users, label: 'Officers' },
  { path: '/police/settings', icon: Settings, label: 'Settings' },
];

export function PoliceDashboardLayout({ children }: PoliceDashboardLayoutProps) {
  const { user, logout } = useAuth();
  const { activeAlerts } = useSOS();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const activeCount = activeAlerts.filter(a => a.status === 'ACTIVE').length;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-sidebar flex">
      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-sidebar border-r border-sidebar-border transform transition-transform duration-300 lg:relative lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-4 border-b border-sidebar-border">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-sidebar-primary flex items-center justify-center">
                <Shield className="h-6 w-6 text-sidebar-primary-foreground" />
              </div>
              <div>
                <h1 className="font-bold text-sidebar-foreground">SAHELI 2.0</h1>
                <p className="text-xs text-muted-foreground">Police Command</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-3 space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                className={({ isActive }) => cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent"
                )}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
                {item.label === 'Active Alerts' && activeCount > 0 && (
                  <span className="ml-auto h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center animate-alert-flash">
                    {activeCount}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>

          {/* User Section */}
          <div className="p-3 border-t border-sidebar-border">
            <div className="flex items-center gap-3 px-3 py-2">
              <div className="h-9 w-9 rounded-full bg-sidebar-accent flex items-center justify-center">
                <span className="text-sm font-semibold text-sidebar-foreground">
                  {user?.name?.charAt(0) || 'P'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">
                  {user?.name || 'Officer'}
                </p>
                <p className="text-xs text-muted-foreground truncate">Police Officer</p>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                className="text-sidebar-foreground hover:bg-sidebar-accent"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Bar */}
        <header className="h-16 border-b border-sidebar-border bg-sidebar px-4 flex items-center justify-between sticky top-0 z-30">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden text-sidebar-foreground"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="flex-1" />

          <div className="flex items-center gap-3">
            {/* Notification Dropdown */}
            <div className="relative group">
              <Button variant="ghost" size="icon" className="relative text-sidebar-foreground">
                <Bell className="h-5 w-5" />
                {activeCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-[10px] flex items-center justify-center text-destructive-foreground font-bold animate-alert-flash">
                    {activeCount}
                  </span>
                )}
              </Button>

              {/* Dropdown Menu */}
              <div className="absolute right-0 top-full mt-2 w-80 bg-sidebar-accent border border-sidebar-border rounded-xl shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="p-3 border-b border-sidebar-border">
                  <h3 className="font-semibold text-sidebar-foreground">Notifications</h3>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {activeCount > 0 ? (
                    <>
                      {activeAlerts.filter(a => a.status === 'ACTIVE').slice(0, 5).map((alert) => (
                        <a
                          key={alert.id}
                          href="/police/alerts"
                          className="flex items-center gap-3 p-3 hover:bg-sidebar-border/50 transition-colors"
                        >
                          <div className="h-8 w-8 rounded-full bg-destructive/20 flex items-center justify-center">
                            <AlertTriangle className="h-4 w-4 text-destructive" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-sidebar-foreground truncate">
                              SOS Alert: {alert.victimName}
                            </p>
                            <p className="text-xs text-muted-foreground">{alert.victimPhone}</p>
                          </div>
                          <span className="text-xs text-destructive animate-pulse">URGENT</span>
                        </a>
                      ))}
                    </>
                  ) : (
                    <div className="p-4 text-center text-muted-foreground text-sm">
                      No new notifications
                    </div>
                  )}
                </div>
                <a
                  href="/police/alerts"
                  className="block p-3 text-center text-sm text-primary hover:bg-sidebar-border/50 border-t border-sidebar-border"
                >
                  View all alerts
                </a>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6 bg-background/5">
          {children}
        </main>
      </div>
    </div>
  );
}
