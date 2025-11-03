/**
 * AI Gateway Page
 * Browse and explore available AI models
 */

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Search, ExternalLink } from 'lucide-react';
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
import { useModelStore } from '@/hooks/use-model-store';
import { filterModels } from '@/services/model-store-service';
import type { ModelFilters, Model } from '@/types/model-store';
import { isCloudModel } from '@/types/model-store';

export function AIGatewayPage() {
  const { models, providers, isLoading } = useModelStore();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<string>('all');
  const [selectedCapability, setSelectedCapability] = useState<string>('all');

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

  // Get unique capabilities across all models
  const allCapabilities = useMemo(() => {
    const caps = new Set<string>();
    models.forEach((m) => m.capabilities.forEach((c) => caps.add(c)));
    return Array.from(caps).sort();
  }, [models]);

  const handleModelClick = (modelId: string) => {
    navigate(`/models/${modelId}`);
  };

  if (isLoading) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <PageHeader
        title="AI Gateway"
        description="Seamlessly integrate AI models into your Vercel project."
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
        <h3 className="text-lg font-semibold">Browse Models</h3>

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
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="All Providers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Providers</SelectItem>
              {providers.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Capability Filters */}
        <Tabs value={selectedCapability} onValueChange={setSelectedCapability}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            {allCapabilities.map((cap) => (
              <TabsTrigger key={cap} value={cap}>
                {cap.charAt(0).toUpperCase() + cap.slice(1)}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Model Grid */}
      {filteredModels.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No models found matching your criteria.
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredModels.map((model) => (
            <ModelCard key={model.id} model={model} onClick={handleModelClick} />
          ))}
        </div>
      )}
    </PageLayout>
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
          <img src={`/${model.icon}`} alt={model.name} className="h-8 w-8 rounded" />
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
              src={`/${provider.icon}`}
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
