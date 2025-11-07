/**
 * App Layout Component
 * Two-row header navigation with outlet for child routes
 * Row 1: Global context (scrolls away)
 * Row 2: Primary navigation (sticky)
 */

import { Outlet, Link, useLocation } from 'react-router-dom';
import { LogOut, AlertCircle, Search, Bell, LayoutGrid, ChevronDown, Moon, Sun, Settings, User } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { isTestMode } from '@/lib/session';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTheme } from '@/hooks/use-theme';
import { CommandPalette } from '@/components/CommandPalette';
import { cn } from '@/lib/utils';

export function AppLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const { theme, setTheme } = useTheme();

  // Navigation link component with Vercel-style tab design
  const NavLink = ({
    to,
    disabled,
    children,
  }: {
    to: string;
    disabled?: boolean;
    children: React.ReactNode;
  }) => {
    const active = location.pathname === to || location.pathname.startsWith(`${to}/`);

    if (disabled) {
      return (
        <span className="text-muted-foreground cursor-not-allowed flex items-center">
          {children}
        </span>
      );
    }

    return (
      <Link
        to={to}
        className={cn(
          'relative text-sm font-medium transition-colors hover:text-foreground py-4 px-1',
          active ? 'text-foreground' : 'text-muted-foreground',
          // Active tab underline that blends with separator line
          active && 'after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-primary'
        )}
      >
        {children}
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Test Mode Banner */}
      {isTestMode() && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2">
          <div className="flex items-center justify-center gap-2 text-sm text-amber-600 dark:text-amber-400">
            <AlertCircle className="h-4 w-4" />
            <span className="font-medium">Test Mode Active</span>
            <span className="text-muted-foreground">
              - You are logged in as a test user for development/testing
            </span>
          </div>
        </div>
      )}

      {/* Command Palette */}
      <CommandPalette />

      <header className="border-b">
        {/* Row 1: Global Context - Vercel Style */}
        <div className="border-b px-4 py-2 flex items-center justify-between">
          {/* Left Section: Logo / Workspace / Context */}
          <div className="flex items-center gap-2">
            {/* Logo Icon Only (no text) */}
            <Link to="/" className="flex items-center">
              <img
                src="/brand/assets/icon/dark/leger-icon-dark.svg"
                alt="Leger"
                className="h-6 w-6"
              />
            </Link>

            {/* Forward Slash Separator */}
            <span className="text-muted-foreground text-sm">/</span>

            {/* Workspace/Project Name */}
            <span className="text-sm font-medium">{user?.email?.split('@')[0] || 'workspace'}</span>

            {/* Context Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                  Hobby
                  <ChevronDown className="ml-1 h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem>Hobby</DropdownMenuItem>
                <DropdownMenuItem disabled>Pro (Coming Soon)</DropdownMenuItem>
                <DropdownMenuItem disabled>Enterprise (Coming Soon)</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Right Section: Search / Feedback / Icons / Profile */}
          <div className="flex items-center gap-3">
            {/* Search Trigger */}
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-2 text-sm text-muted-foreground hover:text-foreground"
              onClick={() => {
                const event = new KeyboardEvent('keydown', {
                  key: 'k',
                  metaKey: true,
                  bubbles: true,
                });
                document.dispatchEvent(event);
              }}
            >
              <Search className="h-4 w-4" />
              <span className="hidden md:inline-flex">Find...</span>
              <kbd className="hidden md:inline-flex pointer-events-none h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                <span className="text-xs">⌘</span>K
              </kbd>
            </Button>

            {/* Feedback Link */}
            <Button variant="ghost" size="sm" className="h-8 text-sm" asChild>
              <a href="mailto:thomas@leger.run">
                Feedback
              </a>
            </Button>

            {/* Notifications Icon */}
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Bell className="h-5 w-5" />
              <span className="sr-only">Notifications</span>
            </Button>

            {/* Grid/Apps Icon */}
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <LayoutGrid className="h-5 w-5" />
              <span className="sr-only">Quick Actions</span>
            </Button>

            {/* Avatar with Dropdown (includes theme toggle) */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full h-8 w-8">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-gradient-to-br from-primary/80 to-primary text-primary-foreground">
                      {user?.email?.[0].toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{user?.email}</p>
                    <p className="text-xs text-muted-foreground">
                      {user?.tailnet}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/settings" className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    Account Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                  Theme
                </DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setTheme('light')}>
                  <Sun className="mr-2 h-4 w-4" />
                  Light
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme('dark')}>
                  <Moon className="mr-2 h-4 w-4" />
                  Dark
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme('system')}>
                  <Settings className="mr-2 h-4 w-4" />
                  System
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Row 2: Primary Navigation (sticky) - Vercel Style Tabs */}
        <div className="sticky top-0 bg-background z-10">
          <div className="px-4">
            <nav className="flex items-center gap-6 border-b border-border">
              <NavLink to="/models">Models</NavLink>
              <NavLink to="/providers">Providers</NavLink>
              <NavLink to="/releases">Releases</NavLink>
              <NavLink to="/marketplace">Marketplace</NavLink>
              <NavLink to="/settings">Settings</NavLink>
            </nav>
          </div>
        </div>
      </header>

      {/* Main content area */}
      <main>
        <Outlet />
      </main>
    </div>
  );
}
