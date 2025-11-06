/**
 * AI Gateway Models Page
 * Browse and explore available AI models
 */

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ExternalLink, LayoutGrid, Table as TableIcon, SearchX } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { useModelStore } from '@/hooks/use-model-store';
import { filterModels } from '@/services/model-store-service';
import type { ModelFilters, Model } from '@/types/model-store';
import { isCloudModel } from '@/types/model-store';
import { resolveIconPath } from '@/assets/icons';

type ViewMode = 'cards' | 'table';

export function AIGatewayModelsPage() {
  const { models, providers, isLoading } = useModelStore();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<string>('all');
  const [selectedCapability, setSelectedCapability] = useState<string>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('table');

  // Build filter object
  const filters: ModelFilters = useMemo(() => {
    const f: ModelFilters = {};
    if (search) f.search = search;
    if (selectedProvider !== 'all') f.provider = selectedProvider;
    if (selectedCapability !== 'all') f.capability = selectedCapability;
    return f;
  }, [search, selectedProvider, selectedCapability]);

  // Filter models
  const filteredModels = useMemo(() => {
    return filterModels(models, filters);
  }, [models, filters]);

  // Get unique capabilities across all models with counts
  const allCapabilities = useMemo(() => {
    const caps = new Set<string>();
    models.forEach((m) => m.capabilities.forEach((c) => caps.add(c)));
    return Array.from(caps).sort();
  }, [models]);

  // Count models per capability
  const capabilityCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    allCapabilities.forEach((cap) => {
      counts[cap] = models.filter((m) => m.capabilities.includes(cap)).length;
    });
    return counts;
  }, [models, allCapabilities]);

  // Count models per provider
  const providerCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    providers.forEach((p) => {
      counts[p.id] = models.filter((m) => m.providers.some((mp) => mp.id === p.id)).length;
    });
    return counts;
  }, [models, providers]);

  const handleModelClick = (modelId: string) => {
    navigate(`/ai-gateway/models/${modelId}`);
  };

  const handleClearFilters = () => {
    setSearch('');
    setSelectedProvider('all');
    setSelectedCapability('all');
  };

  if (isLoading) {
    return (
      <PageLayout>
        <PageHeader
          title="Models"
          description="Explore the model catalog, compare capabilities, and find the right fit for your AI workloads."
        />
        <div className="mb-8">
          <Skeleton className="h-6 w-48 mb-4" />
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-start gap-3 mb-4">
                  <Skeleton className="h-8 w-8 rounded" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
                <Skeleton className="h-12 w-full mb-4" />
                <div className="space-y-2 mb-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-16" />
                </div>
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
        title="Models"
        description="Explore the model catalog, compare capabilities, and find the right fit for your AI workloads."
      />

      <div className="mb-6 text-sm text-muted-foreground">
        <a
          href="https://docs.leger.run/ai-gateway"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline inline-flex items-center gap-1"
        >
          Learn more
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      {/* Search and Filters */}
      <div className="mb-8 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Browse Models</h3>

          {/* View Toggle */}
          <div className="flex gap-1 border rounded-md p-1">
            <Button
              variant={viewMode === 'cards' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('cards')}
              className="px-3"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'table' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('table')}
              className="px-3"
            >
              <TableIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search models..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={selectedProvider} onValueChange={setSelectedProvider}>
            <SelectTrigger className="w-full sm:w-[240px]">
              <SelectValue placeholder="All Providers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Providers ({models.length})</SelectItem>
              {providers.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name} ({providerCounts[p.id] || 0})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Capability Filters */}
        <Tabs value={selectedCapability} onValueChange={setSelectedCapability}>
          <TabsList>
            <TabsTrigger value="all">All ({models.length})</TabsTrigger>
            {allCapabilities.map((cap) => (
              <TabsTrigger key={cap} value={cap}>
                {cap.charAt(0).toUpperCase() + cap.slice(1)} ({capabilityCounts[cap] || 0})
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Model Display */}
      {filteredModels.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <SearchX className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No models found</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-sm">
            Try adjusting your filters or search term to find what you're looking for.
          </p>
          <Button variant="outline" onClick={handleClearFilters}>
            Clear filters
          </Button>
        </div>
      ) : viewMode === 'cards' ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredModels.map((model) => (
            <ModelCard key={model.id} model={model} onClick={handleModelClick} />
          ))}
        </div>
      ) : (
        <ModelTable models={filteredModels} onModelClick={handleModelClick} />
      )}
    </PageLayout>
  );
}

interface ModelTableProps {
  models: Model[];
  onModelClick: (modelId: string) => void;
}

function ModelTable({ models, onModelClick }: ModelTableProps) {
  const { getProvidersForModel } = useModelStore();

  const formatContextWindow = (tokens: number): string => {
    if (tokens >= 1000000) {
      const millions = tokens / 1000000;
      return `${millions % 1 === 0 ? millions.toFixed(0) : millions.toFixed(1)}M`;
    }
    if (tokens >= 1000) {
      return `${(tokens / 1000).toFixed(0)}K`;
    }
    return `${tokens}`;
  };

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[40%]">Model</TableHead>
            <TableHead className="text-right">Context</TableHead>
            <TableHead className="text-right">Input</TableHead>
            <TableHead className="text-right">Output</TableHead>
            <TableHead className="text-right">Providers</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {models.map((model) => {
            const modelProviders = getProvidersForModel(model.id);
            const isCloud = isCloudModel(model);

            return (
              <TableRow
                key={model.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => onModelClick(model.id)}
              >
                {/* Model Column */}
                <TableCell>
                  <div className="flex items-center gap-3">
                    <img src={resolveIconPath(model.icon)} alt={model.name} className="h-8 w-8 rounded" />
                    <div className="min-w-0">
                      <div className="font-semibold truncate">{model.name}</div>
                      <div className="text-xs text-muted-foreground truncate font-mono">
                        {model.maker}/{model.id}
                      </div>
                    </div>
                  </div>
                </TableCell>

                {/* Context Column */}
                <TableCell className="text-right font-medium">
                  {formatContextWindow(model.context_window)}
                </TableCell>

                {/* Input Tokens Column */}
                <TableCell className="text-right font-medium">
                  {isCloud && model.pricing
                    ? `${model.pricing.input_per_1m}/1M`
                    : isCloud
                    ? 'N/A'
                    : 'Local'}
                </TableCell>

                {/* Output Tokens Column */}
                <TableCell className="text-right font-medium">
                  {isCloud && model.pricing
                    ? `${model.pricing.output_per_1m}/1M`
                    : isCloud
                    ? 'N/A'
                    : `${model.ram_required_gb}GB RAM`}
                </TableCell>

                {/* Providers Column */}
                <TableCell className="text-right">
                  <div className="flex gap-1 items-center justify-end">
                    {modelProviders.slice(0, 3).map((provider) => (
                      <img
                        key={provider.id}
                        src={resolveIconPath(provider.icon)}
                        alt={provider.name}
                        className="h-5 w-5 rounded"
                        title={provider.name}
                      />
                    ))}
                    {modelProviders.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{modelProviders.length - 3}
                      </Badge>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

interface ModelCardProps {
  model: Model;
  onClick: (modelId: string) => void;
}

function ModelCard({ model, onClick }: ModelCardProps) {
  const { getProvidersForModel } = useModelStore();
  const modelProviders = getProvidersForModel(model.id);

  return (
    <Card
      className="cursor-pointer hover:shadow-lg transition-shadow"
      onClick={() => onClick(model.id)}
    >
      <CardContent className="p-6">
        {/* Model Icon and Name */}
        <div className="flex items-start gap-3 mb-4">
          <img src={resolveIconPath(model.icon)} alt={model.name} className="h-8 w-8 rounded" />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base truncate">{model.name}</h3>
            <p className="text-xs text-muted-foreground truncate font-mono">
              {model.maker}/{model.id}
            </p>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {model.description}
        </p>

        {/* Model Stats */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Context</span>
            <span className="font-medium">
              {(model.context_window / 1000).toFixed(0)}K
            </span>
          </div>

          {isCloudModel(model) && model.pricing ? (
            <>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Input</span>
                <span className="font-medium">{model.pricing.input_per_1m}/1M</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Output</span>
                <span className="font-medium">{model.pricing.output_per_1m}/1M</span>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">RAM Required</span>
              <span className="font-medium">
                {!isCloudModel(model) ? `${model.ram_required_gb}GB` : 'N/A'}
              </span>
            </div>
          )}
        </div>

        {/* Capabilities */}
        <div className="flex flex-wrap gap-1 mb-4">
          {model.capabilities.slice(0, 3).map((cap) => (
            <Badge key={cap} variant="secondary" className="text-xs">
              {cap}
            </Badge>
          ))}
          {model.capabilities.length > 3 && (
            <Badge variant="secondary" className="text-xs">
              +{model.capabilities.length - 3}
            </Badge>
          )}
        </div>

        {/* Provider Icons */}
        <div className="flex gap-2 items-center">
          {modelProviders.slice(0, 4).map((provider) => (
            <img
              key={provider.id}
              src={resolveIconPath(provider.icon)}
              alt={provider.name}
              className="h-5 w-5 rounded"
              title={provider.name}
            />
          ))}
          {modelProviders.length > 4 && (
            <span className="text-xs text-muted-foreground">
              +{modelProviders.length - 4}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
