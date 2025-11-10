/**
 * Step 2: Service Selection
 * Select which provider to use for each OpenWebUI feature
 * One provider per feature (RAG, Search, STT, TTS, Image Gen, Code Exec)
 * Only shows services whose dependencies are met (configured providers/API keys)
 */

import { useEffect, useState, useMemo } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import type { CrystallizedConfig, MarketplaceService } from '@/types/release-wizard';
import { useSecrets } from '@/hooks/use-secrets';
import { useModelStore } from '@/hooks/use-model-store';
import { resolveIconPath } from '@/assets/icons';

interface ServiceSelectionStepProps {
  config: Partial<CrystallizedConfig>;
  onUpdate: (data: Partial<CrystallizedConfig>) => void;
}

// Map of feature categories to display names
const FEATURE_NAMES: Record<string, string> = {
  'rag': 'Vector Database (RAG)',
  'web-search': 'Web Search',
  'stt': 'Speech-to-Text',
  'tts': 'Text-to-Speech',
  'image-generation': 'Image Generation',
  'code-execution': 'Code Execution',
};

// Special shared services that should only appear when a service in their category is selected
const SHARED_SERVICE_IDS = ['rag-shared', 'code-shared', 'image-shared', 'search-shared'];

export function ServiceSelectionStep({ config, onUpdate }: ServiceSelectionStepProps) {
  const [marketplaceServices, setMarketplaceServices] = useState<MarketplaceService[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { selections: providerSelections, isLoading: isLoadingSecrets } = useSecrets();
  const { providers, isLoading: isLoadingProviders } = useModelStore();

  // Load marketplace service definitions
  useEffect(() => {
    const loadServices = async () => {
      setIsLoading(true);
      try {
        const files = import.meta.glob('/src/data/marketplace/*.json');
        const services: MarketplaceService[] = [];

        for (const path in files) {
          const module = await files[path]() as { default: MarketplaceService };
          services.push(module.default);
        }

        setMarketplaceServices(services);
      } catch (error) {
        console.error('Failed to load marketplace services:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadServices();
  }, []);

  // Check if a provider has been configured (has an API key selected)
  const isProviderConfigured = (providerId: string): boolean => {
    // Check if provider has a selected secret
    if (providerSelections[providerId]) {
      return true;
    }

    // Check if provider doesn't require API key (local providers)
    const provider = providers.find(p => p.id === providerId);
    if (provider && !provider.requires_api_key) {
      return true;
    }

    return false;
  };

  // Check if a service should be shown based on its dependencies
  const isServiceAvailable = (service: MarketplaceService): boolean => {
    // Special handling for shared services
    if (SHARED_SERVICE_IDS.includes(service.id)) {
      // Shared services are handled separately - they should only appear
      // when a non-shared service in their category is selected
      return false;
    }

    // If service has no activation condition and doesn't require API key, it's always available
    if (!service.activation_condition && !service.requires_api_key) {
      return true;
    }

    // If service requires API key, check if it's configured
    // The logic here is to match the service name to a provider
    if (service.requires_api_key) {
      // Try to find a matching provider by checking if any configured provider
      // could provide this service based on naming
      const serviceLower = service.name.toLowerCase();

      // Check common provider matches
      for (const providerId in providerSelections) {
        const providerLower = providerId.toLowerCase();

        // Match based on provider name in service name
        if (serviceLower.includes('openai') && providerLower.includes('openai')) return true;
        if (serviceLower.includes('azure') && providerLower.includes('azure')) return true;
        if (serviceLower.includes('anthropic') && providerLower.includes('anthropic')) return true;
        if (serviceLower.includes('google') && (providerLower.includes('google') || providerLower.includes('gemini'))) return true;
        if (serviceLower.includes('ollama') && providerLower.includes('ollama')) return true;
        if (serviceLower.includes('elevenlabs') && providerLower.includes('elevenlabs')) return true;
        if (serviceLower.includes('deepgram') && providerLower.includes('deepgram')) return true;
        if (serviceLower.includes('tavily') && providerLower.includes('tavily')) return true;
        if (serviceLower.includes('brave') && providerLower.includes('brave')) return true;
      }

      // If no matching provider found, service is not available
      return false;
    }

    // Check activation condition
    if (service.activation_condition) {
      // For now, we don't have access to the full schema state, so we assume
      // services with activation conditions are available
      // This would need to be enhanced to actually check the provider_path
      return true;
    }

    return true;
  };

  // Filter and group services by category
  const groupedServices = useMemo(() => {
    const grouped: Record<string, MarketplaceService[]> = {};

    // First, filter available services (excluding shared services)
    const availableServices = marketplaceServices.filter(isServiceAvailable);

    availableServices.forEach((service) => {
      const category = service.category || 'other';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(service);
    });

    // Sort services within each group
    Object.keys(grouped).forEach((category) => {
      grouped[category].sort((a, b) => a.name.localeCompare(b.name));
    });

    return grouped;
  }, [marketplaceServices, providerSelections, providers]);

  // Check if we should show a shared service for a category
  const shouldShowSharedService = (category: string): MarketplaceService | null => {
    // Check if any service in this category is selected
    const selectedServiceId = config.services?.[category];
    if (!selectedServiceId) {
      return null;
    }

    // Find the corresponding shared service
    const sharedServiceId = `${category.replace('-', '')}-shared`;
    const sharedService = marketplaceServices.find(s => s.id === sharedServiceId);

    return sharedService || null;
  };

  const handleServiceSelect = (featureType: string, serviceId: string) => {
    onUpdate({
      services: {
        ...config.services,
        [featureType]: serviceId || null,
      },
    });
  };

  if (isLoading || isLoadingSecrets || isLoadingProviders) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading services...</div>
      </div>
    );
  }

  // Get the main feature categories we care about
  const mainFeatures = Object.keys(FEATURE_NAMES).filter(
    (feature) => groupedServices[feature] && groupedServices[feature].length > 0
  );

  return (
    <div className="space-y-6">
      <Alert>
        <AlertTitle>Service Selection</AlertTitle>
        <AlertDescription>
          Select services for each feature. Only services with configured providers are shown.
          Choose "None" to disable a feature.
        </AlertDescription>
      </Alert>

      {mainFeatures.length === 0 ? (
        <Alert>
          <AlertTitle>No Services Available</AlertTitle>
          <AlertDescription>
            No services are available because no providers have been configured.
            Please configure providers in the main app before creating a release.
          </AlertDescription>
        </Alert>
      ) : (
        mainFeatures.map((featureType) => {
          const services = groupedServices[featureType] || [];
          const selectedService = config.services?.[featureType] || '';
          const sharedService = shouldShowSharedService(featureType);

          return (
            <Card key={featureType}>
              <CardHeader>
                <CardTitle>{FEATURE_NAMES[featureType] || featureType}</CardTitle>
                <CardDescription>
                  Choose which provider to use for this feature
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup value={selectedService} onValueChange={(value) => handleServiceSelect(featureType, value)}>
                  {/* None option */}
                  <div className="flex items-start space-x-3 p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors">
                    <RadioGroupItem value="" id={`${featureType}-none`} className="mt-1" />
                    <div className="flex-1 space-y-1">
                      <Label
                        htmlFor={`${featureType}-none`}
                        className="text-sm font-medium cursor-pointer"
                      >
                        None (Disable this feature)
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Do not enable {FEATURE_NAMES[featureType]?.toLowerCase() || featureType}
                      </p>
                    </div>
                  </div>

                  {/* Service options */}
                  {services.map((service) => {
                    const iconPath = service.logo ? resolveIconPath(service.logo) : null;

                    return (
                      <div
                        key={service.id}
                        className={`flex items-start space-x-3 p-3 rounded-lg border transition-colors ${
                          selectedService === service.id
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:bg-accent/50'
                        }`}
                      >
                        <RadioGroupItem value={service.id} id={service.id} className="mt-1" />

                        {/* Logo */}
                        {iconPath && (
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 rounded-full bg-background border border-border flex items-center justify-center overflow-hidden">
                              <img
                                src={iconPath}
                                alt={service.name}
                                className="w-5 h-5 object-contain"
                              />
                            </div>
                          </div>
                        )}

                        <div className="flex-1 space-y-1">
                          <Label
                            htmlFor={service.id}
                            className="text-sm font-medium cursor-pointer flex items-center gap-2"
                          >
                            {service.name}
                            {service.requires_api_key && (
                              <Badge variant="outline" className="text-xs">
                                Configured
                              </Badge>
                            )}
                          </Label>

                          {service.description && (
                            <p className="text-xs text-muted-foreground">
                              {service.description}
                            </p>
                          )}

                          {service.openwebui_variables && service.openwebui_variables.length > 0 && (
                            <p className="text-xs text-muted-foreground">
                              {service.openwebui_variables.length} configuration variable(s)
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </RadioGroup>

                {/* Show shared service notice if one is selected */}
                {sharedService && selectedService && (
                  <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <p className="text-xs text-blue-600 dark:text-blue-400">
                      Additional configuration available in Step 3 for shared {FEATURE_NAMES[featureType]} settings
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })
      )}

      {/* Selection Summary */}
      {mainFeatures.some((feature) => config.services?.[feature]) && (
        <Alert>
          <AlertTitle>Active Services</AlertTitle>
          <AlertDescription>
            <div className="space-y-1 mt-2">
              {mainFeatures
                .filter((feature) => config.services?.[feature])
                .map((feature) => {
                  const serviceId = config.services?.[feature];
                  const service = marketplaceServices.find((s) => s.id === serviceId);
                  return (
                    <div key={feature} className="text-sm">
                      <span className="font-medium">{FEATURE_NAMES[feature] || feature}:</span>{' '}
                      {service?.name || serviceId}
                    </div>
                  );
                })}
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
