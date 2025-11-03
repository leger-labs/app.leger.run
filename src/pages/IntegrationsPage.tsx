/**
 * Integrations Page
 * Manage AI provider integrations and API keys
 */

import { useState, useEffect } from 'react';
import { Loader2, ExternalLink, Check, Plus } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useModelStore } from '@/hooks/use-model-store';
import { useSecrets } from '@/hooks/use-secrets';
import type { Provider } from '@/types/model-store';

export function IntegrationsPage() {
  const { providers, models, isLoading: isLoadingModelStore } = useModelStore();
  const { secrets, isLoading: isLoadingSecrets, upsertSecret } = useSecrets();

  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [apiKeyValue, setApiKeyValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [configuredProviders, setConfiguredProviders] = useState<Set<string>>(new Set());

  const isLoading = isLoadingModelStore || isLoadingSecrets;

  // Determine which providers are configured
  useEffect(() => {
    const configured = new Set<string>();
    providers.forEach((provider) => {
      // Local providers don't need API keys
      if (!provider.requires_api_key) {
        configured.add(provider.id);
        return;
      }

      // Check if secret exists for this provider
      if (secrets.some((s) => s.name === provider.requires_api_key)) {
        configured.add(provider.id);
      }
    });
    setConfiguredProviders(configured);
  }, [providers, secrets]);

  const handleAddProvider = (provider: Provider) => {
    setSelectedProvider(provider);
    setApiKeyValue('');
  };

  const handleSaveApiKey = async () => {
    if (!selectedProvider || !selectedProvider.requires_api_key) return;

    setIsSaving(true);
    const success = await upsertSecret(selectedProvider.requires_api_key, apiKeyValue);
    setIsSaving(false);

    if (success) {
      setConfiguredProviders((prev) => new Set([...prev, selectedProvider.id]));
      setSelectedProvider(null);
      setApiKeyValue('');
    }
  };

  const handleCloseDialog = () => {
    setSelectedProvider(null);
    setApiKeyValue('');
  };

  // Get representative pricing for a provider (from any model that uses it)
  const getProviderPricing = (providerId: string) => {
    const model = models.find((m) => m.providers.some((p) => p.id === providerId));
    if (model && 'pricing' in model && model.pricing) {
      return model.pricing;
    }
    return null;
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
        title="Integrations"
        description="The AI Gateway supports routing requests across multiple AI providers. You can control provider preferences using the provider slugs available for copying with the buttons below."
      />

      <div className="mb-6 text-sm text-muted-foreground">
        For more information, see the{' '}
        <a
          href="https://docs.leger.run/ai-gateway/providers"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline inline-flex items-center gap-1"
        >
          AI Gateway provider options documentation
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {providers.map((provider) => {
          const isConfigured = configuredProviders.has(provider.id);
          const pricing = getProviderPricing(provider.id);

          return (
            <Card key={provider.id} className="relative">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={`/${provider.icon}`}
                      alt={provider.name}
                      className="h-8 w-8 rounded"
                    />
                    <CardTitle className="text-lg">{provider.name}</CardTitle>
                  </div>
                  {isConfigured ? (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Check className="h-3 w-3" />
                      Configured
                    </Badge>
                  ) : (
                    provider.requires_api_key && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAddProvider(provider)}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add
                      </Button>
                    )
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  {provider.description}
                </p>

                {pricing && (
                  <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Input</div>
                      <div className="font-medium">{pricing.input_per_1m}/1M</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Output</div>
                      <div className="font-medium">{pricing.output_per_1m}/1M</div>
                    </div>
                    {pricing.cache_read_per_1m && (
                      <div>
                        <div className="text-muted-foreground">Cache Read</div>
                        <div className="font-medium">{pricing.cache_read_per_1m}/1M</div>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-2 text-xs">
                  <a
                    href={`${provider.website}/terms`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-1"
                  >
                    Terms
                    <ExternalLink className="h-3 w-3" />
                  </a>
                  <a
                    href={`${provider.website}/privacy`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-1"
                  >
                    Privacy
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Add Provider Dialog */}
      <Dialog open={!!selectedProvider} onOpenChange={handleCloseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add {selectedProvider?.name} Integration</DialogTitle>
            <DialogDescription>
              Enter your API key to enable {selectedProvider?.name} provider.
              {selectedProvider?.api_key_register_url && (
                <>
                  {' '}
                  You can get your API key from{' '}
                  <a
                    href={selectedProvider.api_key_register_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-1"
                  >
                    {selectedProvider.name} Console
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="api-key">API Key</Label>
              <Input
                id="api-key"
                type="password"
                value={apiKeyValue}
                onChange={(e) => setApiKeyValue(e.target.value)}
                placeholder="Enter your API key"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveApiKey}
              disabled={!apiKeyValue || isSaving}
            >
              {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}
