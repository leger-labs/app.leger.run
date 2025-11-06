/**
 * AI Gateway Layout
 * Provides the two-column layout with persistent sidebar navigation
 */

import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';
import { LayoutDashboard, ListTree, Layers, KeyRound, Boxes } from 'lucide-react';

interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  disabled?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Overview', to: '/ai-gateway/overview', icon: LayoutDashboard },
  { label: 'Models', to: '/ai-gateway/models', icon: Layers },
  { label: 'Providers', to: '/ai-gateway/providers', icon: ListTree },
  { label: 'API Keys', to: '/ai-gateway/api-keys', icon: KeyRound, disabled: true },
  { label: 'Templates', to: '/ai-gateway/templates', icon: Boxes, disabled: true },
];

export function AIGatewayLayout() {
  const location = useLocation();

  return (
    <div className="flex min-h-[calc(100vh-120px)] border-t">
      <aside className="hidden w-64 flex-shrink-0 border-r bg-muted/10 lg:block">
        <div className="space-y-6 px-4 py-6">
          <div>
            <p className="text-xs font-semibold uppercase text-muted-foreground">AI Gateway</p>
            <p className="text-sm text-muted-foreground">
              Configure routing, providers, and catalog resources.
            </p>
          </div>

          <nav className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive =
                location.pathname === item.to || location.pathname.startsWith(`${item.to}/`);

              if (item.disabled) {
                return (
                  <div
                    key={item.to}
                    className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground/60"
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </div>
                );
              }

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={cn(
                    'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-muted text-foreground'
                      : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>
        </div>
      </aside>

      <div className="flex-1 overflow-y-auto">
        <div className="border-b px-4 py-3 lg:hidden">
          <nav className="flex flex-wrap gap-2">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive =
                location.pathname === item.to || location.pathname.startsWith(`${item.to}/`);

              if (item.disabled) {
                return (
                  <span
                    key={item.to}
                    className="flex items-center gap-1 rounded-full border border-dashed px-3 py-1 text-xs text-muted-foreground"
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </span>
                );
              }

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={cn(
                    'flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                    isActive
                      ? 'border-transparent bg-primary/10 text-primary'
                      : 'border-transparent bg-muted text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>
        </div>

        <Outlet />
      </div>
    </div>
  );
}
