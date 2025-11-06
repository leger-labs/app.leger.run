/**
 * Marketplace Page
 * Browse and install OpenWebUI service integrations
 */

import { useState, useMemo } from 'react';
import { Loader2, Search, ExternalLink, SearchX, Key, Plus } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useMarketplace } from '@/hooks/use-marketplace';
import { filterServices } from '@/services/marketplace-service';
import { toast } from 'sonner';
import type { Service, ServiceVariable, ServiceFilters } from '@/types/marketplace';
import { cn } from '@/lib/utils';
import { resolveIconPath } from '@/assets/icons';

// Category display names
const CATEGORY_LABELS: Record<string, string> = {
  llm: 'LLM',
  rag: 'RAG',
  'image-generation': 'Image Generation',
  'speech-to-text': 'Speech-to-Text',
  'text-to-speech': 'Text-to-Speech',
  'web-search': 'Web Search',
  storage: 'Storage',
  database: 'Database',
  cache: 'Cache',
  'code-execution': 'Code Execution',
  'document-integration': 'Document Integration',
  'content-extraction': 'Content Extraction',
};

function formatCategoryLabel(id: string) {
  if (id === 'all') return 'All Categories';
  if (CATEGORY_LABELS[id]) return CATEGORY_LABELS[id];

  return id
    .split(/[-_]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function MarketplacePage() {
  const { services, isLoading, getCategories } = useMarketplace();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [configValues, setConfigValues] = useState<Record<string, any>>({});
  const [isInstalling, setIsInstalling] = useState(false);

  // Get categories with counts
  const categories = useMemo(() => {
    const cats = getCategories();
    return [
      { id: 'all', count: services.length },
      ...cats.sort((a, b) => formatCategoryLabel(a.id).localeCompare(formatCategoryLabel(b.id))),
    ];
  }, [services, getCategories]);

  // Build filter object
  const filters: ServiceFilters = useMemo(() => {
    const f: ServiceFilters = {};
    if (search) f.search = search;
    if (selectedCategory !== 'all') f.category = selectedCategory;
    return f;
  }, [search, selectedCategory]);

  // Filter services
  const filteredServices = useMemo(() => {
    return filterServices(services, filters);
  }, [services, filters]);

  const handleInstall = (service: Service) => {
    setSelectedService(service);
    // Initialize config values with defaults
    const initialConfig: Record<string, any> = {};
    service.openwebui_variables.forEach((variable) => {
      initialConfig[variable.name] = variable.default;
    });
    setConfigValues(initialConfig);
  };

  const handleSaveConfig = async () => {
    if (!selectedService) return;

    setIsInstalling(true);

    // Simulate installation (replace with actual API call)
    await new Promise((resolve) => setTimeout(resolve, 1000));

    toast.success(`${selectedService.name} installed`, {
      description: 'Service has been added to your configuration.',
    });

    setIsInstalling(false);
    setSelectedService(null);
    setConfigValues({});
  };

  const handleCloseDialog = () => {
    setSelectedService(null);
    setConfigValues({});
  };

  const handleClearFilters = () => {
    setSearch('');
    setSelectedCategory('all');
  };

  if (isLoading) {
    return (
      <PageLayout>
        <PageHeader
          title="Marketplace"
          description="Browse and install 70+ service integrations for your Leger deployment."
        />
        <div className="mb-8">
          <Skeleton className="h-6 w-48 mb-4" />
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-12 w-12 mb-4" />
                <Skeleton className="h-5 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2 mb-4" />
                <Skeleton className="h-9 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <PageHeader
        title="Marketplace"
        description="Browse and install 70+ service integrations for your Leger deployment."
      />

      <div className="mb-6 text-sm text-muted-foreground">
        <a
          href="https://docs.leger.run/marketplace"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline inline-flex items-center gap-1"
        >
          Learn more
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      <div className="lg:flex lg:items-start lg:gap-8">
        {/* Category Sidebar */}
        <aside className="mb-8 lg:mb-0 lg:w-64 lg:shrink-0">
          <div className="rounded-lg border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-3 lg:sticky lg:top-24">
            <h4 className="mb-2 px-2 text-xs font-semibold uppercase text-muted-foreground tracking-wide">
              Categories
            </h4>
            <nav className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:gap-1 lg:overflow-visible lg:pb-0">
              {categories.map((cat) => {
                const isActive = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={cn(
                      'flex min-w-[160px] items-center justify-between gap-3 rounded-md px-3 py-2 text-sm transition-colors lg:min-w-0',
                      isActive
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'hover:bg-muted text-muted-foreground'
                    )}
                  >
                    <span className="truncate">{formatCategoryLabel(cat.id)}</span>
                    <span className={cn('text-xs', isActive ? 'text-primary' : 'text-muted-foreground')}>
                      {cat.count}
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Search and Results */}
        <div className="flex-1 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Browse Services</h3>
            <div className="text-sm text-muted-foreground">
              {filteredServices.length} service{filteredServices.length !== 1 ? 's' : ''}
            </div>
          </div>

          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search services..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Service Grid */}
          {filteredServices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <SearchX className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No services found</h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-sm">
                Try adjusting your filters or search term to find what you're looking for.
              </p>
              <Button variant="outline" onClick={handleClearFilters}>
                Clear filters
              </Button>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredServices.map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  onInstall={handleInstall}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Install Service Dialog */}
      <Dialog open={!!selectedService} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <img
                src={resolveIconPath(selectedService?.logo)}
                alt={selectedService?.name}
                className="h-8 w-8 rounded"
              />
              Install {selectedService?.name}
            </DialogTitle>
            <DialogDescription>
              Configure environment variables for this service integration.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {selectedService?.openwebui_variables.map((variable) => (
              <VariableInput
                key={variable.name}
                variable={variable}
                value={configValues[variable.name]}
                onChange={(value) =>
                  setConfigValues((prev) => ({ ...prev, [variable.name]: value }))
                }
              />
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancel
            </Button>
            <Button onClick={handleSaveConfig} disabled={isInstalling}>
              {isInstalling && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Install
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}

interface ServiceCardProps {
  service: Service;
  onInstall: (service: Service) => void;
}

function ServiceCard({ service, onInstall }: ServiceCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        {/* Header with logo and API key badge */}
        <div className="flex items-start justify-between mb-4">
          <img src={resolveIconPath(service.logo)} alt={service.name} className="h-12 w-12 rounded" />
          {service.requires_api_key && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Key className="h-3 w-3" />
              API Key
            </Badge>
          )}
        </div>

        {/* Service Name */}
        <h3 className="font-semibold text-base mb-2 line-clamp-1">{service.name}</h3>

        {/* Category Badge */}
        <div className="mb-4">
          <Badge variant="outline" className="text-xs">
            {CATEGORY_LABELS[service.category] || service.category}
          </Badge>
        </div>

        {/* Variable Count */}
        <p className="text-sm text-muted-foreground mb-4">
          {service.openwebui_variables.length} variable
          {service.openwebui_variables.length !== 1 ? 's' : ''}
        </p>

        {/* Install Button */}
        <Button
          className="w-full"
          variant="outline"
          onClick={() => onInstall(service)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Install
        </Button>
      </CardContent>
    </Card>
  );
}

interface VariableInputProps {
  variable: ServiceVariable;
  value: any;
  onChange: (value: any) => void;
}

function VariableInput({ variable, value, onChange }: VariableInputProps) {
  if (variable.type === 'bool') {
    return (
      <div className="flex items-center justify-between space-x-2">
        <div className="flex-1">
          <Label htmlFor={variable.name} className="font-mono text-sm">
            {variable.name}
          </Label>
          {variable.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {variable.description}
            </p>
          )}
        </div>
        <Switch
          id={variable.name}
          checked={value === true || value === 'True' || value === 'true'}
          onCheckedChange={onChange}
        />
      </div>
    );
  }

  if (variable.options && variable.options.length > 0) {
    return (
      <div className="space-y-2">
        <Label htmlFor={variable.name} className="font-mono text-sm">
          {variable.name}
        </Label>
        <select
          id={variable.name}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 border rounded-md bg-background"
        >
          <option value="">Select an option...</option>
          {variable.options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        {variable.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {variable.description}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={variable.name} className="font-mono text-sm">
        {variable.name}
      </Label>
      <Input
        id={variable.name}
        type={variable.type === 'int' || variable.type === 'float' ? 'number' : 'text'}
        value={value || ''}
        onChange={(e) => {
          const val = e.target.value;
          if (variable.type === 'int') {
            onChange(val ? parseInt(val, 10) : null);
          } else if (variable.type === 'float') {
            onChange(val ? parseFloat(val) : null);
          } else {
            onChange(val);
          }
        }}
        placeholder={variable.default?.toString() || ''}
      />
      {variable.description && (
        <p className="text-xs text-muted-foreground line-clamp-2">
          {variable.description}
        </p>
      )}
    </div>
  );
}
