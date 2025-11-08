/**
 * Step 2: Service Selection
 * Select which provider to use for each OpenWebUI feature
 * One provider per feature (RAG, Search, STT, TTS, Image Gen, Code Exec)
 */

import { useEffect, useState, useMemo } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { CrystallizedConfig, MarketplaceService } from '@/types/release-wizard';

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

export function ServiceSelectionStep({ config, onUpdate }: ServiceSelectionStepProps) {
  const [marketplaceServices, setMarketplaceServices] = useState<MarketplaceService[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  // Group services by category/feature type
  const groupedServices = useMemo(() => {
    const grouped: Record<string, MarketplaceService[]> = {};

    marketplaceServices.forEach((service) => {
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
  }, [marketplaceServices]);

  const handleServiceSelect = (featureType: string, serviceId: string) => {
    onUpdate({
      services: {
        ...config.services,
        [featureType]: serviceId || null,
      },
    });
  };

  if (isLoading) {
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
          OpenWebUI can only use one provider per feature. Choose the provider you want to use for
          each feature type, or select "None" to disable the feature.
        </AlertDescription>
      </Alert>

      {mainFeatures.length === 0 ? (
        <Alert>
          <AlertTitle>No Services Available</AlertTitle>
          <AlertDescription>
            No marketplace services were found. Please check the data files.
          </AlertDescription>
        </Alert>
      ) : (
        mainFeatures.map((featureType) => {
          const services = groupedServices[featureType] || [];
          const selectedService = config.services?.[featureType] || '';

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
                  <div className="flex items-start space-x-3 p-3 rounded-lg border border-border">
                    <RadioGroupItem value="" id={`${featureType}-none`} />
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
                  {services.map((service) => (
                    <div
                      key={service.id}
                      className={`flex items-start space-x-3 p-3 rounded-lg border ${
                        selectedService === service.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border'
                      }`}
                    >
                      <RadioGroupItem value={service.id} id={service.id} />
                      <div className="flex-1 space-y-1">
                        <Label
                          htmlFor={service.id}
                          className="text-sm font-medium cursor-pointer"
                        >
                          {service.name}
                        </Label>
                        {service.requires_api_key && (
                          <p className="text-xs text-amber-600 dark:text-amber-400">
                            Requires API key
                          </p>
                        )}
                        {service.openwebui_variables && service.openwebui_variables.length > 0 && (
                          <p className="text-xs text-muted-foreground">
                            {service.openwebui_variables.length} configuration variable(s)
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </RadioGroup>
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
