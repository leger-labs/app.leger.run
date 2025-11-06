/**
 * Configuration Summary Component
 *
 * Shows a visual summary of enabled features and selected providers
 */

import { useMemo } from 'react';
import type { UiSchema } from '@rjsf/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  CheckCircle2,
  Server,
  Database,
  Search,
  Image,
  Mic,
  Volume2,
  Code,
  Cloud,
  Shield,
  Sparkles,
  Info,
} from 'lucide-react';
import { getValueAtPath } from '@/lib/progressive-disclosure';

interface ConfigurationSummaryProps {
  formData: Record<string, unknown>;
  schema: any;
  uiSchema?: UiSchema;
}

interface EnabledFeature {
  key: string;
  label: string;
  icon: React.ReactNode;
  provider?: string;
  providerLabel?: string;
}

const FEATURE_ICONS: Record<string, React.ReactNode> = {
  rag: <Database className="h-4 w-4" />,
  web_search: <Search className="h-4 w-4" />,
  image_generation: <Image className="h-4 w-4" />,
  speech_to_text: <Mic className="h-4 w-4" />,
  text_to_speech: <Volume2 className="h-4 w-4" />,
  code_execution: <Code className="h-4 w-4" />,
  code_interpreter: <Code className="h-4 w-4" />,
  google_drive: <Cloud className="h-4 w-4" />,
  onedrive: <Cloud className="h-4 w-4" />,
  oauth_signup: <Shield className="h-4 w-4" />,
  ldap: <Shield className="h-4 w-4" />,
  title_generation: <Sparkles className="h-4 w-4" />,
  autocomplete_generation: <Sparkles className="h-4 w-4" />,
  tags_generation: <Sparkles className="h-4 w-4" />,
};

function getFeatureIcon(feature: string): React.ReactNode {
  return FEATURE_ICONS[feature] || <CheckCircle2 className="h-4 w-4" />;
}

function humanize(value: string): string {
  const cleaned = value
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleaned) {
    return value || 'Unknown';
  }

  return cleaned.replace(/\b\w/g, (char) => char.toUpperCase());
}

type JsonSchema = {
  properties?: Record<string, any>;
};

function getFeatureDefinitions(schema: JsonSchema | undefined) {
  const featureProps = schema?.properties?.features?.properties ?? {};
  return new Map(
    Object.entries(featureProps).map(([key, value]) => {
      const property = value as { title?: string } | undefined;
      const title =
        property && typeof property.title === 'string' && property.title.trim()
          ? property.title
          : humanize(key);
      return [key, { title }];
    })
  );
}

function buildFeatureProviderMap(schema: JsonSchema | undefined) {
  const providers = schema?.properties?.providers?.properties ?? {};
  const providerEntries = Object.entries(providers).map(([key, value]) => {
    const property = value as { [key: string]: unknown } | undefined;
    const orderValue = property && typeof property['x-display-order'] === 'number'
      ? (property['x-display-order'] as number)
      : Number.MAX_SAFE_INTEGER;

    return {
      key,
      order: orderValue,
      dependsOn: (property?.['x-depends-on'] as Record<string, unknown> | undefined) ?? undefined,
    };
  });

  providerEntries.sort((a, b) => a.order - b.order);

  const map = new Map<string, string[]>();

  providerEntries.forEach(({ key, dependsOn }) => {
    if (!dependsOn || typeof dependsOn !== 'object') {
      return;
    }

    Object.keys(dependsOn).forEach((dependency) => {
      if (!dependency.startsWith('features.')) {
        return;
      }

      const featureKey = dependency.split('.')[1];
      if (!featureKey) {
        return;
      }

      const existing = map.get(featureKey) ?? [];
      if (!existing.includes(key)) {
        existing.push(key);
      }
      map.set(featureKey, existing);
    });
  });

  return map;
}

function getEnumLabelFromUiSchema(
  providerKey: string,
  providerValue: string,
  uiSchema?: UiSchema
): string | undefined {
  const providerUi = uiSchema && typeof uiSchema === 'object' ? (uiSchema as any).providers?.[providerKey] : undefined;
  const options = providerUi?.['ui:options']?.enumOptions;

  if (Array.isArray(options)) {
    const match = options.find(
      (option: any) => option && typeof option === 'object' && option.value === providerValue
    );
    if (match) {
      const label = typeof match.label === 'string' ? match.label : undefined;
      if (label && label.trim()) {
        return label;
      }
    }
  }

  return undefined;
}

function getProviderLabel(
  providerKey: string,
  providerValue: string,
  schema: JsonSchema | undefined,
  uiSchema?: UiSchema
): string {
  if (!providerValue) {
    return 'Not configured';
  }

  const uiLabel = getEnumLabelFromUiSchema(providerKey, providerValue, uiSchema);
  if (uiLabel) {
    return uiLabel;
  }

  const providerSchema = schema?.properties?.providers?.properties?.[providerKey] as any;

  if (providerSchema) {
    const enumLabels = providerSchema?.['x-enum-labels'];
    if (enumLabels && typeof enumLabels === 'object') {
      const label = enumLabels[providerValue];
      if (typeof label === 'string' && label.trim()) {
        return label;
      }
    }

    const enumValues: unknown[] = Array.isArray(providerSchema?.enum) ? providerSchema.enum : [];
    const enumNames: unknown[] = Array.isArray(providerSchema?.enumNames) ? providerSchema.enumNames : [];
    const index = enumValues.indexOf(providerValue);
    if (index >= 0) {
      const label = enumNames[index];
      if (typeof label === 'string' && label.trim()) {
        return label;
      }
    }
  }

  return humanize(providerValue);
}

export function ConfigurationSummary({ formData, schema, uiSchema }: ConfigurationSummaryProps) {
  const featureDefinitions = useMemo(() => getFeatureDefinitions(schema), [schema]);
  const featureProviderMap = useMemo(() => buildFeatureProviderMap(schema), [schema]);

  const enabledFeatures = useMemo(() => {
    const features: EnabledFeature[] = [];
    const featuresData = (formData.features as Record<string, boolean>) || {};
    const providersData = (formData.providers as Record<string, string>) || {};

    // Check each feature
    Object.entries(featuresData).forEach(([key, enabled]) => {
      if (enabled) {
        const definition = featureDefinitions.get(key);
        const feature: EnabledFeature = {
          key,
          label: definition?.title ?? humanize(key),
          icon: getFeatureIcon(key),
        };

        // Add provider info if applicable
        const providerKeys = featureProviderMap.get(key);
        if (providerKeys && providerKeys.length > 0) {
          for (const providerKey of providerKeys) {
            const providerValue = providersData[providerKey];
            if (typeof providerValue === 'string' && providerValue) {
              feature.provider = providerKey;
              feature.providerLabel = getProviderLabel(providerKey, providerValue, schema, uiSchema);
              break;
            }
          }
        }

        features.push(feature);
      }
    });

    return features;
  }, [featureDefinitions, featureProviderMap, formData, schema, uiSchema]);

  const storageProvider = useMemo(() => {
    const provider = getValueAtPath(formData, 'providers.storage_provider') as string;
    return getProviderLabel('storage_provider', provider || '', schema, uiSchema);
  }, [formData, schema, uiSchema]);

  const authProvider = useMemo(() => {
    const provider = getValueAtPath(formData, 'providers.auth_provider') as string;
    return getProviderLabel('auth_provider', provider || '', schema, uiSchema);
  }, [formData, schema, uiSchema]);

  if (enabledFeatures.length === 0) {
    return (
      <Alert className="border-muted bg-muted/20">
        <Info className="h-4 w-4" />
        <AlertTitle>Minimal Configuration</AlertTitle>
        <AlertDescription>
          No optional features are currently enabled. This will deploy a minimal setup with just
          the core services (OpenWebUI, LiteLLM, and supporting infrastructure).
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <Alert className="border-primary/20 bg-primary/5">
        <CheckCircle2 className="h-4 w-4 text-primary" />
        <AlertTitle>Configuration Summary</AlertTitle>
        <AlertDescription>
          Review your selections below. You can go back to any step to make changes.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Server className="h-5 w-5" />
            Enabled Features ({enabledFeatures.length})
          </CardTitle>
          <CardDescription>
            These features will be configured in your deployment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {enabledFeatures.map((feature) => (
              <div
                key={feature.key}
                className="flex items-center justify-between p-3 rounded-lg border bg-card"
              >
                <div className="flex items-center gap-3">
                  <div className="text-primary">{feature.icon}</div>
                  <div>
                    <div className="font-medium text-sm">{feature.label}</div>
                    {feature.providerLabel && (
                      <div className="text-xs text-muted-foreground mt-0.5">
                        Using {feature.providerLabel}
                      </div>
                    )}
                  </div>
                </div>
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Core Settings
          </CardTitle>
          <CardDescription>Essential configuration for your deployment</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
              <div className="flex items-center gap-3">
                <Shield className="h-4 w-4 text-primary" />
                <div>
                  <div className="font-medium text-sm">Authentication</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {authProvider}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
              <div className="flex items-center gap-3">
                <Cloud className="h-4 w-4 text-primary" />
                <div>
                  <div className="font-medium text-sm">External Storage</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {storageProvider}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>What happens next?</AlertTitle>
        <AlertDescription>
          When you save this configuration, it will be used to generate Podman Quadlet files for
          deployment. You can then deploy this release to your infrastructure using the Leger CLI.
        </AlertDescription>
      </Alert>
    </div>
  );
}
