/**
 * Providers Page
 * Manage AI provider connections and credentials
 */

import { useState, useEffect, useMemo } from 'react';
import { Loader2, ExternalLink, Check, Plus, Eye, EyeOff, Search, FileX, BadgeCheck } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { PageHeader } from '@/components/layout/PageHeader';
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useModelStore } from '@/hooks/use-model-store';
import { useSecrets } from '@/hooks/use-secrets';
import { toast } from 'sonner';
import { useMarketplace } from '@/hooks/use-marketplace';
import type { Service, ServiceVariable } from '@/types/marketplace';
import { resolveIconPath } from '@/assets/icons';

interface ProviderDisplay {
  id: string;
  name: string;
  icon: string;
  description: string;
  requiresApiKey: string | null;
  apiKeyRegisterUrl?: string | null;
  website?: string | null;
  source: 'llm' | 'marketplace';
  relatedServices: string[];
}

interface ExtractedSecret {
  envVar: string;
}

function extractSecretVariables(service: Service): ExtractedSecret[] {
  const secrets: ExtractedSecret[] = [];

  service.openwebui_variables.forEach((variable) => {
    const envVar = inferEnvVarName(variable);
    if (!envVar) return;

    // Avoid duplicates within the same service
    if (secrets.some((secret) => secret.envVar === envVar)) {
      return;
    }

    secrets.push({
      envVar,
    });
  });

  return secrets;
}

function inferEnvVarName(variable: ServiceVariable): string | null {
  if (typeof variable.default === 'string') {
    const envMatch = variable.default.match(/^\$\{([A-Z0-9_]+)\}$/);
    if (envMatch) {
      return envMatch[1];
    }
  }

  // Fallback to variable name if it looks like a secret token
  if (/API|TOKEN|SECRET|KEY/.test(variable.name)) {
    return variable.name.toUpperCase();
  }

  return null;
}

function humanizeEnvVar(value: string): string {
  return value
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function ProvidersPage() {
  const { providers: baseProviders, isLoading: isLoadingModelStore } = useModelStore();
  const { services, isLoading: isLoadingMarketplace } = useMarketplace();
  const { secrets, isLoading: isLoadingSecrets, upsertSecret } = useSecrets();

  const [search, setSearch] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'configured' | 'available'>('all');
  const [selectedProvider, setSelectedProvider] = useState<ProviderDisplay | null>(null);
  const [apiKeyValue, setApiKeyValue] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [configuredProviders, setConfiguredProviders] = useState<Set<string>>(new Set());

  const isLoading = isLoadingModelStore || isLoadingMarketplace || isLoadingSecrets;

  const providerEntries = useMemo<ProviderDisplay[]>(() => {
    const entries: ProviderDisplay[] = [];
    const envVarMap = new Map<string, ProviderDisplay>();

    baseProviders.forEach((provider) => {
      const entry: ProviderDisplay = {
        id: provider.id,
        name: provider.name,
        icon: provider.icon,
        description: provider.description,
        requiresApiKey: provider.requires_api_key,
        apiKeyRegisterUrl: provider.api_key_register_url ?? null,
        website: provider.website,
        source: 'llm',
        relatedServices: [],
      };

      entries.push(entry);

      if (provider.requires_api_key) {
        envVarMap.set(provider.requires_api_key, entry);
      }
    });

    services.forEach((service) => {
      const secrets = extractSecretVariables(service);

      secrets.forEach(({ envVar }) => {
        let entry = envVarMap.get(envVar);

        if (!entry) {
          entry = {
            id: envVar.toLowerCase(),
            name: humanizeEnvVar(envVar),
            icon: service.logo,
            description: `Credentials used by ${service.name} integration`,
            requiresApiKey: envVar,
            apiKeyRegisterUrl: null,
            website: null,
            source: 'marketplace',
            relatedServices: [],
          };

          entries.push(entry);
          envVarMap.set(envVar, entry);
        }

        if (!entry.icon && service.logo) {
          entry.icon = service.logo;
        }

        if (!entry.relatedServices.includes(service.id)) {
          entry.relatedServices.push(service.id);
        }
      });
    });

    return entries;
  }, [baseProviders, services]);

  // Determine which providers are configured
  useEffect(() => {
    const configured = new Set<string>();
    providerEntries.forEach((provider) => {
      // Local providers don't need API keys
      if (!provider.requiresApiKey) {
        configured.add(provider.id);
        return;
      }

      // Check if secret exists for this provider
      if (secrets.some((s) => s.name === provider.requiresApiKey)) {
        configured.add(provider.id);
      }
    });
    setConfiguredProviders(configured);
  }, [providerEntries, secrets]);

  const handleAddProvider = (provider: ProviderDisplay) => {
    setSelectedProvider(provider);
    setApiKeyValue('');
    setIsEditMode(false);
    setShowPassword(false);
    setTestResult(null);
  };

  const handleEditProvider = (provider: ProviderDisplay) => {
    setSelectedProvider(provider);
    // Load existing API key value
    const existingSecret = secrets.find((s) => s.name === provider.requiresApiKey);
    setApiKeyValue(existingSecret?.value || '');
    setIsEditMode(true);
    setShowPassword(false);
    setTestResult(null);
  };

  const handleTestApiKey = async () => {
    if (!apiKeyValue || !selectedProvider) return;

    setIsTesting(true);
    setTestResult(null);

    // Simulate API key validation with basic format checking
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Basic validation by provider
    let isValid = false;
    const key = apiKeyValue.trim();

    if (selectedProvider.id === 'anthropic' && key.startsWith('sk-ant-')) {
      isValid = true;
    } else if (selectedProvider.id === 'openai' && key.startsWith('sk-')) {
      isValid = true;
    } else if (selectedProvider.id === 'gemini' && key.length > 20) {
      isValid = true;
    } else if (key.length > 10) {
      // Generic validation for other providers
      isValid = true;
    }

    if (isValid) {
      setTestResult('success');
      toast.success('API key format is valid', {
        description: 'The API key appears to be correctly formatted.',
      });
    } else {
      setTestResult('error');
      toast.error('Invalid API key format', {
        description: 'Please check the API key format for this provider.',
      });
    }

    setIsTesting(false);
  };

  const handleSaveApiKey = async () => {
    if (!selectedProvider || !selectedProvider.requiresApiKey) return;

    setIsSaving(true);
    const success = await upsertSecret(selectedProvider.requiresApiKey, apiKeyValue);
    setIsSaving(false);

    if (success) {
      setConfiguredProviders((prev) => new Set([...prev, selectedProvider.id]));
      setSelectedProvider(null);
      setApiKeyValue('');
      setShowPassword(false);
      setTestResult(null);
    }
  };

  const handleCloseDialog = () => {
    setSelectedProvider(null);
    setApiKeyValue('');
    setIsEditMode(false);
    setShowPassword(false);
    setTestResult(null);
  };

  const handleClearFilters = () => {
    setSearch('');
    setFilterTab('all');
  };

  // Filter providers based on search and filter tab
  const filteredProviders = useMemo(() => {
    let filtered = providerEntries;

    // Filter by tab
    if (filterTab === 'configured') {
      filtered = filtered.filter((p) => configuredProviders.has(p.id));
    } else if (filterTab === 'available') {
      filtered = filtered.filter((p) => !configuredProviders.has(p.id));
    }

    // Filter by search
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter((p) => {
        const description = p.description || '';
        return (
          p.name.toLowerCase().includes(searchLower) ||
          description.toLowerCase().includes(searchLower) ||
          (p.requiresApiKey ?? '').toLowerCase().includes(searchLower)
        );
      });
    }

    return filtered;
  }, [providerEntries, configuredProviders, filterTab, search]);

  if (isLoading) {
    return (
      <PageLayout>
        <PageHeader
          title="Providers"
          description="Connect external AI providers and manage credentials for automatic routing and fallbacks."
        />
        <div className="mb-8">
          <Skeleton className="h-4 w-48 mb-4" />
          <Skeleton className="h-10 w-full mb-4" />
          <Skeleton className="h-10 w-64" />
        </div>
        <div className="space-y-1.5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between px-4 py-3 border rounded-lg"
            >
              <div className="flex items-center gap-4 flex-1">
                <Skeleton className="h-8 w-8 rounded flex-shrink-0" />
                <Skeleton className="h-5 w-32" />
              </div>
              <Skeleton className="h-9 w-16" />
            </div>
          ))}
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <PageHeader
        title="Providers"
        description="Connect external AI providers and manage credentials for automatic routing and fallbacks."
      />

      <div className="mb-6 text-sm text-muted-foreground">
        {configuredProviders.size} provider{configuredProviders.size !== 1 ? 's' : ''} configured
      </div>

      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search providers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <Tabs value={filterTab} onValueChange={(v) => setFilterTab(v as typeof filterTab)}>
          <TabsList>
            <TabsTrigger value="all">All ({providerEntries.length})</TabsTrigger>
            <TabsTrigger value="configured">
              Configured ({configuredProviders.size})
            </TabsTrigger>
            <TabsTrigger value="available">
              Available ({providerEntries.length - configuredProviders.size})
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Provider List */}
      {filteredProviders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <FileX className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No providers found</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-sm">
            {filterTab === 'configured'
              ? 'You haven\'t configured any providers yet. Add an integration to get started.'
              : 'Try adjusting your search or filter to find what you\'re looking for.'}
          </p>
          <Button variant="outline" onClick={handleClearFilters}>
            Clear filters
          </Button>
        </div>
      ) : (
        <div className="space-y-1.5">
          {filteredProviders.map((provider) => {
            const isConfigured = configuredProviders.has(provider.id);

            return (
              <div
                key={provider.id}
                className="flex items-center justify-between px-4 py-3 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                {/* Left: Logo */}
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <img
                    src={resolveIconPath(provider.icon)}
                    alt={provider.name}
                    className="h-8 w-8 rounded flex-shrink-0"
                  />

                  {/* Center: Name and Badge */}
                  <div className="flex flex-col flex-1 min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-medium text-sm truncate">{provider.name}</span>
                      <Badge variant="outline" className="uppercase text-[10px] tracking-wide">
                        {provider.source === 'llm' ? 'LLM Provider' : 'Marketplace Secret'}
                      </Badge>
                      {isConfigured && (
                        <Badge variant="secondary" className="flex items-center gap-1 flex-shrink-0">
                          <Check className="h-3 w-3" />
                          Configured
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mt-1">
                      {provider.requiresApiKey && (
                        <span className="inline-flex items-center gap-1">
                          <BadgeCheck className="h-3 w-3" />
                          {provider.requiresApiKey}
                        </span>
                      )}
                      {provider.relatedServices.length > 0 && (
                        <span className="truncate">
                          Used by {provider.relatedServices.length}{' '}
                          {provider.relatedServices.length === 1 ? 'integration' : 'integrations'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Add/Edit Button */}
                <div className="flex-shrink-0">
                  {provider.requiresApiKey && (
                    isConfigured ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditProvider(provider)}
                      >
                        Edit
                      </Button>
                    ) : (
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
              </div>
            );
          })}
        </div>
      )}

      {/* Add Provider Dialog */}
      <Dialog open={!!selectedProvider} onOpenChange={handleCloseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? 'Edit' : 'Add'} {selectedProvider?.name} Integration
            </DialogTitle>
            <DialogDescription>
              Enter your API key to enable {selectedProvider?.name} provider.
              {selectedProvider?.apiKeyRegisterUrl && (
                <>
                  {' '}
                  You can get your API key from{' '}
                  <a
                    href={selectedProvider.apiKeyRegisterUrl}
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
              <div className="relative">
                <Input
                  id="api-key"
                  type={showPassword ? 'text' : 'password'}
                  value={apiKeyValue}
                  onChange={(e) => {
                    setApiKeyValue(e.target.value);
                    setTestResult(null); // Reset test result when key changes
                  }}
                  placeholder="Enter your API key"
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Your API key is stored securely and only used for requests to{' '}
                {selectedProvider?.name}
              </p>
            </div>

            {/* Test Result */}
            {testResult && (
              <div
                className={`text-sm flex items-center gap-2 ${
                  testResult === 'success' ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {testResult === 'success' ? (
                  <>
                    <Check className="h-4 w-4" />
                    <span>API key format is valid</span>
                  </>
                ) : (
                  <span>Invalid API key format</span>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancel
            </Button>
            <Button
              variant="secondary"
              onClick={handleTestApiKey}
              disabled={!apiKeyValue || isTesting}
            >
              {isTesting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Test API Key
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
