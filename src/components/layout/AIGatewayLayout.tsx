/**
 * AI Gateway Layout
 * Provides the two-column layout with persistent sidebar navigation
 */

import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  to: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Models', to: '/ai-gateway/models' },
  { label: 'Providers', to: '/ai-gateway/providers' },
];

export function AIGatewayLayout() {
  const location = useLocation();

  return (
    <div className="flex min-h-[calc(100vh-120px)] border-t">
      <aside className="hidden w-64 flex-shrink-0 border-r bg-muted/10 lg:block">
        <div className="pl-8 py-6">
          <nav className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const isActive =
                location.pathname === item.to || location.pathname.startsWith(`${item.to}/`);

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={cn(
                    'block rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-muted text-foreground'
                      : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                  )}
                >
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
              const isActive =
                location.pathname === item.to || location.pathname.startsWith(`${item.to}/`);

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={cn(
                    'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                    isActive
                      ? 'border-transparent bg-primary/10 text-primary'
                      : 'border-transparent bg-muted text-muted-foreground hover:text-foreground'
                  )}
                >
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
