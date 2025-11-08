/**
 * Step 1: Model Selection
 * Select cloud and local models to load on the system
 */

import { useEffect, useState, useMemo } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { apiClient } from '@/lib/api-client';
import type { CrystallizedConfig, ModelDefinition } from '@/types/release-wizard';

interface ModelSelectionStepProps {
  config: Partial<CrystallizedConfig>;
  onUpdate: (data: Partial<CrystallizedConfig>) => void;
}

export function ModelSelectionStep({ config, onUpdate }: ModelSelectionStepProps) {
  const [cloudModels, setCloudModels] = useState<ModelDefinition[]>([]);
  const [localModels, setLocalModels] = useState<ModelDefinition[]>([]);
  const [enabledProviders, setEnabledProviders] = useState<string[]>([]);
  const [filterProvider, setFilterProvider] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  const selectedModelIds = useMemo(
    () => config.models?.selected?.map((m) => m.model_id) || [],
    [config.models]
  );

  // Load model definitions from JSON files
  useEffect(() => {
    const loadModels = async () => {
      setIsLoading(true);
      try {
        // Dynamically import all cloud model files
        const cloudFiles = import.meta.glob('/src/data/models/cloud/*.json');
        const cloudData: ModelDefinition[] = [];

        for (const path in cloudFiles) {
          const module = await cloudFiles[path]() as { default: ModelDefinition };
          if (module.default.enabled) {
            cloudData.push(module.default);
          }
        }

        setCloudModels(cloudData.sort((a, b) => a.name.localeCompare(b.name)));

        // Load local models
        const localFiles = import.meta.glob('/src/data/models/local/*.json');
        const localData: ModelDefinition[] = [];

        for (const path in localFiles) {
          const module = await localFiles[path]() as { default: ModelDefinition };
          if (module.default.enabled) {
            localData.push(module.default);
          }
        }

        setLocalModels(localData.sort((a, b) => a.name.localeCompare(b.name)));
      } catch (error) {
        console.error('Failed to load models:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadModels();
  }, []);

  // Fetch enabled providers (with API keys)
  useEffect(() => {
    const fetchEnabledProviders = async () => {
      try {
        const response = await apiClient.getEnabledProviders();
        setEnabledProviders(response.providers);
      } catch (error) {
        console.error('Failed to fetch enabled providers:', error);
        setEnabledProviders([]);
      }
    };

    fetchEnabledProviders();
  }, []);

  const handleToggleModel = (model: ModelDefinition, type: 'cloud' | 'local') => {
    const currentSelected = config.models?.selected || [];
    const isSelected = selectedModelIds.includes(model.id);

    let newSelected;
    if (isSelected) {
      newSelected = currentSelected.filter((m) => m.model_id !== model.id);
    } else {
      const defaultProvider = model.providers.find((p) => p.is_default);
      newSelected = [
        ...currentSelected,
        {
          model_id: model.id,
          provider: defaultProvider?.id || model.providers[0]?.id || 'unknown',
          type,
        },
      ];
    }

    onUpdate({
      models: { selected: newSelected },
    });
  };

  // Filter cloud models by provider
  const filteredCloudModels = useMemo(() => {
    if (filterProvider === 'all') {
      return cloudModels;
    }
    return cloudModels.filter((model) =>
      model.providers.some((p) => p.id === filterProvider)
    );
  }, [cloudModels, filterProvider]);

  // Get unique provider IDs from cloud models
  const availableProviders = useMemo(() => {
    const providerSet = new Set<string>();
    cloudModels.forEach((model) => {
      model.providers.forEach((p) => providerSet.add(p.id));
    });
    return Array.from(providerSet);
  }, [cloudModels]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading models...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Alert>
        <AlertTitle>Model Selection</AlertTitle>
        <AlertDescription>
          Choose which models to load. Cloud models require API keys configured in the Providers
          page. Local models run on llama-swap and require no API keys.
        </AlertDescription>
      </Alert>

      {/* Cloud Models Section */}
      <Card>
        <CardHeader>
          <CardTitle>Cloud Models</CardTitle>
          <CardDescription>
            Models from cloud providers (requires API keys)
          </CardDescription>

          {/* Provider Filter */}
          <div className="flex flex-wrap gap-2 mt-4">
            <Badge
              variant={filterProvider === 'all' ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setFilterProvider('all')}
            >
              All
            </Badge>
            {availableProviders.map((providerId) => {
              const isEnabled = enabledProviders.includes(providerId);
              return (
                <Badge
                  key={providerId}
                  variant={filterProvider === providerId ? 'default' : 'outline'}
                  className={`cursor-pointer ${!isEnabled ? 'opacity-50' : ''}`}
                  onClick={() => setFilterProvider(providerId)}
                >
                  {providerId}
                  {!isEnabled && ' (disabled)'}
                </Badge>
              );
            })}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {filteredCloudModels.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No cloud models available for the selected provider
            </div>
          ) : (
            filteredCloudModels.map((model) => {
              const isSelected = selectedModelIds.includes(model.id);
              const defaultProvider = model.providers.find((p) => p.is_default);
              const isProviderEnabled = enabledProviders.some((ep) =>
                model.providers.some((mp) => mp.id === ep)
              );

              return (
                <div
                  key={model.id}
                  className={`flex items-start space-x-3 p-3 rounded-lg border ${
                    isSelected ? 'border-primary bg-primary/5' : 'border-border'
                  } ${!isProviderEnabled ? 'opacity-50' : ''}`}
                >
                  <Checkbox
                    id={model.id}
                    checked={isSelected}
                    onCheckedChange={() => handleToggleModel(model, 'cloud')}
                    disabled={!isProviderEnabled}
                  />
                  <div className="flex-1 space-y-1">
                    <Label
                      htmlFor={model.id}
                      className="text-sm font-medium cursor-pointer"
                    >
                      {model.name}
                    </Label>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>Provider: {defaultProvider?.id || model.providers[0]?.id}</span>
                      <Separator orientation="vertical" className="h-3" />
                      <span>{(model.context_window / 1000).toFixed(0)}K context</span>
                      {model.pricing && (
                        <>
                          <Separator orientation="vertical" className="h-3" />
                          <span>{model.pricing.tier}</span>
                        </>
                      )}
                    </div>
                    {model.description && (
                      <p className="text-xs text-muted-foreground">{model.description}</p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Local Models Section */}
      <Card>
        <CardHeader>
          <CardTitle>Local Models</CardTitle>
          <CardDescription>
            Models run locally via llama-swap (no API keys needed)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {localModels.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No local models available
            </div>
          ) : (
            localModels.map((model) => {
              const isSelected = selectedModelIds.includes(model.id);

              return (
                <div
                  key={model.id}
                  className={`flex items-start space-x-3 p-3 rounded-lg border ${
                    isSelected ? 'border-primary bg-primary/5' : 'border-border'
                  }`}
                >
                  <Checkbox
                    id={model.id}
                    checked={isSelected}
                    onCheckedChange={() => handleToggleModel(model, 'local')}
                  />
                  <div className="flex-1 space-y-1">
                    <Label
                      htmlFor={model.id}
                      className="text-sm font-medium cursor-pointer"
                    >
                      {model.name}
                    </Label>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {model.ram_required_gb && (
                        <>
                          <span>~{model.ram_required_gb}GB RAM</span>
                          <Separator orientation="vertical" className="h-3" />
                        </>
                      )}
                      <span>{(model.context_window / 1000).toFixed(0)}K context</span>
                      {model.quantization && (
                        <>
                          <Separator orientation="vertical" className="h-3" />
                          <span>{model.quantization}</span>
                        </>
                      )}
                    </div>
                    {model.description && (
                      <p className="text-xs text-muted-foreground">{model.description}</p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Selection Summary */}
      {selectedModelIds.length > 0 && (
        <Alert>
          <AlertTitle>Selected: {selectedModelIds.length} model(s)</AlertTitle>
          <AlertDescription>
            <div className="flex flex-wrap gap-2 mt-2">
              {config.models?.selected?.map((m) => (
                <Badge key={m.model_id} variant="secondary">
                  {m.model_id}
                </Badge>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
