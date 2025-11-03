import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Circle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CategoryTab {
  id: string;
  label: string;
  status?: 'complete' | 'incomplete' | 'error';
  description?: string;
}

interface CategoryTabsProps {
  tabs: CategoryTab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  children?: React.ReactNode;
  className?: string;
}

function TabStatusIcon({ status }: { status?: 'complete' | 'incomplete' | 'error' }) {
  if (!status) return null;

  switch (status) {
    case 'complete':
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    case 'error':
      return <AlertCircle className="h-4 w-4 text-destructive" />;
    case 'incomplete':
      return <Circle className="h-4 w-4 text-muted-foreground" />;
    default:
      return null;
  }
}

export function CategoryTabs({
  tabs,
  activeTab,
  onTabChange,
  children,
  className,
}: CategoryTabsProps) {
  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className={cn('w-full', className)}>
      <TabsList className="grid w-full gap-2 h-auto p-1" style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}>
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.id}
            value={tab.id}
            className={cn(
              'flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2',
              'transition-all duration-200'
            )}
          >
            <TabStatusIcon status={tab.status} />
            <span className="font-medium">{tab.label}</span>
          </TabsTrigger>
        ))}
      </TabsList>
      {children}
    </Tabs>
  );
}

interface CategoryTabPanelProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

export function CategoryTabPanel({ value, children, className }: CategoryTabPanelProps) {
  return (
    <TabsContent value={value} className={cn('mt-6', className)}>
      {children}
    </TabsContent>
  );
}
