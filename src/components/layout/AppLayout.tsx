/**
 * App Layout Component
 * Two-row header navigation with outlet for child routes
 */

import { Outlet, Link, useLocation } from 'react-router-dom';
import { Github, FileText, BookOpen } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
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
import { ThemeToggle } from '@/components/theme-toggle';

export function AppLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const getInitials = (email: string) => {
    const parts = email.split('@')[0].split('.');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return email[0].toUpperCase();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Row 1: Global Context */}
      <header className="border-b">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <img
              src="/brand/assets/logotype/light/leger-logo-light.svg"
              alt="Leger"
              className="h-8 dark:hidden"
            />
            <img
              src="/brand/assets/logotype/dark/leger-logo-dark.svg"
              alt="Leger"
              className="h-8 hidden dark:block"
            />
          </Link>

          {/* Right side actions */}
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <a
                href="https://github.com/leger-labs/leger"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github className="h-4 w-4 mr-2" />
                Star
              </a>
            </Button>

            <Button variant="ghost" size="sm" asChild>
              <a
                href="https://github.com/leger-labs/leger/blob/main/CHANGELOG.md"
                target="_blank"
                rel="noopener noreferrer"
              >
                <FileText className="h-4 w-4 mr-2" />
                Changelog
              </a>
            </Button>

            <Button variant="ghost" size="sm" asChild>
              <a
                href="https://docs.leger.run"
                target="_blank"
                rel="noopener noreferrer"
              >
                <BookOpen className="h-4 w-4 mr-2" />
                Docs
              </a>
            </Button>

            <ThemeToggle />

            {/* User Avatar with Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {user ? getInitials(user.email) : 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user?.display_name || 'User'}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/settings">Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>Logout</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Row 2: Primary Navigation */}
        <div className="border-t bg-muted/30">
          <div className="max-w-7xl mx-auto px-6">
            <nav className="flex items-center h-12 gap-6">
              <Link
                to="/api-keys"
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  isActive('/api-keys')
                    ? 'text-foreground'
                    : 'text-muted-foreground'
                }`}
              >
                API Keys
              </Link>
              <Link
                to="/releases"
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  isActive('/releases') || location.pathname.startsWith('/releases/')
                    ? 'text-foreground'
                    : 'text-muted-foreground'
                }`}
              >
                Releases
              </Link>
              <button
                disabled
                className="text-sm font-medium text-muted-foreground/50 cursor-not-allowed"
              >
                Models
              </button>
              <button
                disabled
                className="text-sm font-medium text-muted-foreground/50 cursor-not-allowed"
              >
                Marketplace
              </button>
              <Link
                to="/settings"
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  isActive('/settings')
                    ? 'text-foreground'
                    : 'text-muted-foreground'
                }`}
              >
                Settings
              </Link>
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
