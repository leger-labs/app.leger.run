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
import { useModelStore } from '@/hooks/use-model-store';
import { resolveIconPath } from '@/assets/icons';
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
  const { providers } = useModelStore();

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

  // Filter cloud models: ONLY show models where at least one provider is configured
  const availableCloudModels = useMemo(() => {
    return cloudModels.filter((model) =>
      model.providers.some((p) => enabledProviders.includes(p.id))
    );
  }, [cloudModels, enabledProviders]);

  // Filter by selected provider tab
  const filteredCloudModels = useMemo(() => {
    if (filterProvider === 'all') {
      return availableCloudModels;
    }
    return availableCloudModels.filter((model) =>
      model.providers.some((p) => p.id === filterProvider)
    );
  }, [availableCloudModels, filterProvider]);

  // Get unique enabled provider IDs from available cloud models
  const availableProviders = useMemo(() => {
    const providerSet = new Set<string>();
    availableCloudModels.forEach((model) => {
      model.providers.forEach((p) => {
        if (enabledProviders.includes(p.id)) {
          providerSet.add(p.id);
        }
      });
    });
    return Array.from(providerSet);
  }, [availableCloudModels, enabledProviders]);

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
          Select models from providers you've configured with API keys. Only models from configured providers are shown below.
          Local models run on llama-swap and require no API keys.
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
          {availableProviders.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              <Badge
                variant={filterProvider === 'all' ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setFilterProvider('all')}
              >
                All
              </Badge>
              {availableProviders.map((providerId) => (
                <Badge
                  key={providerId}
                  variant={filterProvider === providerId ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => setFilterProvider(providerId)}
                >
                  {providerId}
                </Badge>
              ))}
            </div>
          )}
        </CardHeader>
        <CardContent>
          {filteredCloudModels.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              {availableCloudModels.length === 0
                ? 'No cloud models available. Configure provider API keys first.'
                : 'No cloud models available for the selected provider.'}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredCloudModels.map((model) => {
                const isSelected = selectedModelIds.includes(model.id);
                const modelProviders = model.providers
                  .filter((p) => enabledProviders.includes(p.id))
                  .map((p) => providers.find((provider) => provider.id === p.id))
                  .filter(Boolean);

                return (
                  <Card
                    key={model.id}
                    className={`cursor-pointer transition-all ${
                      isSelected
                        ? 'border-primary shadow-md'
                        : 'hover:shadow-lg'
                    }`}
                    onClick={() => handleToggleModel(model, 'cloud')}
                  >
                    <CardContent className="p-4">
                      {/* Checkbox in top-right corner */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          {model.icon && (
                            <img
                              src={resolveIconPath(model.icon)}
                              alt={model.name}
                              className="h-8 w-8 rounded flex-shrink-0"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm truncate">{model.name}</h3>
                            <p className="text-xs text-muted-foreground truncate font-mono">
                              {model.maker}/{model.id}
                            </p>
                          </div>
                        </div>
                        <Checkbox
                          id={model.id}
                          checked={isSelected}
                          onCheckedChange={() => handleToggleModel(model, 'cloud')}
                          onClick={(e) => e.stopPropagation()}
                          className="flex-shrink-0"
                        />
                      </div>

                      {/* Description */}
                      {model.description && (
                        <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                          {model.description}
                        </p>
                      )}

                      {/* Model Stats */}
                      <div className="space-y-1.5 mb-3">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Context</span>
                          <span className="font-medium">
                            {(model.context_window / 1000).toFixed(0)}K
                          </span>
                        </div>

                        {model.pricing && (
                          <>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">Input</span>
                              <span className="font-medium">{model.pricing.input_per_1m}/1M</span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">Output</span>
                              <span className="font-medium">{model.pricing.output_per_1m}/1M</span>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Capabilities */}
                      {model.capabilities && model.capabilities.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
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
                      )}

                      {/* Provider Icons */}
                      <div className="flex gap-1.5 items-center">
                        {modelProviders.slice(0, 4).map((provider) => (
                          provider && (
                            <img
                              key={provider.id}
                              src={resolveIconPath(provider.icon)}
                              alt={provider.name}
                              className="h-5 w-5 rounded"
                              title={provider.name}
                            />
                          )
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
              })}
            </div>
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
        <CardContent>
          {localModels.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No local models available
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {localModels.map((model) => {
                const isSelected = selectedModelIds.includes(model.id);

                return (
                  <Card
                    key={model.id}
                    className={`cursor-pointer transition-all ${
                      isSelected
                        ? 'border-primary shadow-md'
                        : 'hover:shadow-lg'
                    }`}
                    onClick={() => handleToggleModel(model, 'local')}
                  >
                    <CardContent className="p-4">
                      {/* Checkbox in top-right corner */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          {model.icon && (
                            <img
                              src={resolveIconPath(model.icon)}
                              alt={model.name}
                              className="h-8 w-8 rounded flex-shrink-0"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm truncate">{model.name}</h3>
                            <p className="text-xs text-muted-foreground truncate font-mono">
                              {model.maker}/{model.id}
                            </p>
                          </div>
                        </div>
                        <Checkbox
                          id={model.id}
                          checked={isSelected}
                          onCheckedChange={() => handleToggleModel(model, 'local')}
                          onClick={(e) => e.stopPropagation()}
                          className="flex-shrink-0"
                        />
                      </div>

                      {/* Description */}
                      {model.description && (
                        <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                          {model.description}
                        </p>
                      )}

                      {/* Model Stats */}
                      <div className="space-y-1.5 mb-3">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Context</span>
                          <span className="font-medium">
                            {(model.context_window / 1000).toFixed(0)}K
                          </span>
                        </div>

                        {model.ram_required_gb && (
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">RAM Required</span>
                            <span className="font-medium">{model.ram_required_gb}GB</span>
                          </div>
                        )}

                        {model.quantization && (
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Quantization</span>
                            <span className="font-medium">{model.quantization}</span>
                          </div>
                        )}
                      </div>

                      {/* Capabilities */}
                      {model.capabilities && model.capabilities.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
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
                      )}

                      {/* Local badge */}
                      <div className="flex gap-1.5 items-center">
                        <Badge variant="outline" className="text-xs">
                          Local
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
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
