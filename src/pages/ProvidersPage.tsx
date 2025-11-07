/**
 * Providers Page
 * Manage AI provider connections and credentials
 */

import { useMemo, useState } from 'react';
import {
  Check,
  Eye,
  EyeOff,
  FileX,
  Loader2,
  Plus,
  Search,
  ExternalLink,
} from 'lucide-react';
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
import { useMarketplace } from '@/hooks/use-marketplace';
import { useSecrets } from '@/hooks/use-secrets';
import type { Provider } from '@/types/model-store';
import type { SecretWithValue } from '@/types';
import type { ServiceVariable } from '@/types/marketplace';
import { resolveIconPath } from '@/assets/icons';
import { cn } from '@/lib/utils';

function inferEnvVarName(variable: ServiceVariable): string | null {
  if (typeof variable.default === 'string') {
    const envMatch = variable.default.match(/^\$\{([A-Z0-9_]+)\}$/);
    if (envMatch) {
      return envMatch[1];
    }
  }

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
  const { providers: llmProviders, isLoading: isLoadingModelStore } = useModelStore();
  const { services, isLoading: isLoadingMarketplace } = useMarketplace();
  const {
    secrets,
    selections,
    isLoading: isLoadingSecrets,
    isSaving,
    isDeleting,
    upsertSecret,
    deleteSecret,
    setProviderSelection,
  } = useSecrets();

  const [search, setSearch] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'configured' | 'available'>('all');
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [showKeyForm, setShowKeyForm] = useState(false);
  const [editingSecret, setEditingSecret] = useState<SecretWithValue | null>(null);
  const [keyLabel, setKeyLabel] = useState('');
  const [keyValue, setKeyValue] = useState('');
  const [setAsDefault, setSetAsDefault] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const providers = useMemo<Provider[]>(() => {
    const combined = [...llmProviders];
    const envVarMap = new Map<string, Provider>();

    llmProviders.forEach((provider) => {
      if (provider.requires_api_key) {
        envVarMap.set(provider.requires_api_key, provider);
      }
    });

    services.forEach((service) => {
      const seenForService = new Set<string>();

      service.openwebui_variables.forEach((variable) => {
        const envVar = inferEnvVarName(variable);
        if (!envVar || seenForService.has(envVar)) {
          return;
        }

        seenForService.add(envVar);

        if (!envVarMap.has(envVar)) {
          const entry: Provider = {
            id: `marketplace-${envVar.toLowerCase()}`,
            name: humanizeEnvVar(envVar),
            icon: service.logo || '',
            website: '',
            requires_api_key: envVar,
            api_key_register_url: undefined,
            description: `Credentials for ${service.name}`,
            provider_type: 'api',
          };

          envVarMap.set(envVar, entry);
          combined.push(entry);
        }
      });
    });

    return combined;
  }, [llmProviders, services]);

  const isLoading = isLoadingModelStore || isLoadingMarketplace || isLoadingSecrets;

  const providerSecretMap = useMemo(() => {
    const map: Record<string, SecretWithValue[]> = {};
    providers.forEach((provider) => {
      if (!provider.requires_api_key) {
        map[provider.id] = [];
        return;
      }

      const base = provider.requires_api_key;
      map[provider.id] = secrets.filter(
        (secret) => secret.name === base || secret.name.startsWith(`${base}:`)
      );
    });
    return map;
  }, [providers, secrets]);

  const configuredProviders = useMemo(() => {
    const configured = new Set<string>();
    providers.forEach((provider) => {
      if (!provider.requires_api_key) {
        configured.add(provider.id);
        return;
      }

      const keys = providerSecretMap[provider.id] ?? [];
      if (keys.length > 0) {
        configured.add(provider.id);
      }
    });
    return configured;
  }, [providers, providerSecretMap]);

  const providerKeys = selectedProvider
    ? providerSecretMap[selectedProvider.id] ?? []
    : [];
  const effectiveSelection = selectedProvider
    ? selections[selectedProvider.id] || providerKeys[0]?.name
    : undefined;

  const handleOpenProvider = (provider: Provider) => {
    const keys = providerSecretMap[provider.id] ?? [];
    setSelectedProvider(provider);
    setEditingSecret(null);
    setKeyLabel('');
    setKeyValue('');
    setShowPassword(false);
    const shouldOpenForm = keys.length === 0;
    setSetAsDefault(shouldOpenForm);
    setShowKeyForm(shouldOpenForm);
  };

  const handleCloseDialog = () => {
    setSelectedProvider(null);
    setShowKeyForm(false);
    setEditingSecret(null);
    setKeyLabel('');
    setKeyValue('');
    setSetAsDefault(false);
    setShowPassword(false);
  };

  const handleKeyFormOpenChange = (open: boolean) => {
    if (!open) {
      setShowKeyForm(false);
      setEditingSecret(null);
      setKeyLabel('');
      setKeyValue('');
      setSetAsDefault(false);
      setShowPassword(false);
      return;
    }

    setShowKeyForm(true);
  };

  const openAddKeyForm = () => {
    if (!selectedProvider) return;
    setEditingSecret(null);
    setKeyLabel('');
    setKeyValue('');
    setSetAsDefault(providerKeys.length === 0);
    setShowPassword(false);
    setShowKeyForm(true);
  };

  const handleEditKey = (secret: SecretWithValue) => {
    if (!selectedProvider) return;
    setEditingSecret(secret);
    setKeyLabel(secret.label ?? '');
    setKeyValue(secret.value);
    setSetAsDefault(effectiveSelection === secret.name);
    setShowPassword(false);
    setShowKeyForm(true);
  };

  const handleSaveKey = async () => {
    if (!selectedProvider || !selectedProvider.requires_api_key) return;

    const value = keyValue.trim();
    if (!value) return;

    const label = keyLabel.trim();
    const baseName = selectedProvider.requires_api_key;

    let secretName = editingSecret?.name;
    if (!secretName) {
      secretName = buildSecretName(baseName, label, secrets);
    }

    const saved = await upsertSecret(secretName, value, label || undefined);

    if (saved) {
      const shouldSelect = (() => {
        if (!selectedProvider) return false;
        if (!editingSecret) {
          return setAsDefault || providerKeys.length === 0;
        }
        return setAsDefault;
      })();

      if (shouldSelect) {
        await setProviderSelection(selectedProvider.id, secretName);
      }

      setShowKeyForm(false);
      setEditingSecret(null);
      setKeyLabel('');
      setKeyValue('');
      setSetAsDefault(false);
      setShowPassword(false);
    }
  };

  const handleSelectKey = async (secretName: string) => {
    if (!selectedProvider) return;
    await setProviderSelection(selectedProvider.id, secretName);
  };

  const handleDeleteKey = async (secretName: string) => {
    if (!selectedProvider) return;
    if (!window.confirm('Delete this API key?')) return;

    const deleted = await deleteSecret(secretName);

    if (deleted) {
      const wasSelected = effectiveSelection === secretName;
      const remainingKeys = providerKeys.filter((key) => key.name !== secretName);

      if (wasSelected && remainingKeys.length > 0) {
        await setProviderSelection(selectedProvider.id, remainingKeys[0].name);
      }
    }
  };

  const handleClearFilters = () => {
    setSearch('');
    setFilterTab('all');
  };

  const filteredProviders = useMemo(() => {
    let filtered = providers;

    if (filterTab === 'configured') {
      filtered = filtered.filter((p) => configuredProviders.has(p.id));
    } else if (filterTab === 'available') {
      filtered = filtered.filter((p) => !configuredProviders.has(p.id));
    }

    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(searchLower) ||
          p.description.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  }, [providers, configuredProviders, filterTab, search]);

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
            <TabsTrigger value="all">All ({providers.length})</TabsTrigger>
            <TabsTrigger value="configured">
              Configured ({configuredProviders.size})
            </TabsTrigger>
            <TabsTrigger value="available">
              Available ({providers.length - configuredProviders.size})
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {filteredProviders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <FileX className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No providers found</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-sm">
            {filterTab === 'configured'
              ? "You haven't configured any providers yet. Add an integration to get started."
              : "Try adjusting your search or filter to find what you're looking for."}
          </p>
          <Button variant="outline" onClick={handleClearFilters}>
            Clear filters
          </Button>
        </div>
      ) : (
        <div className="space-y-1.5">
          {filteredProviders.map((provider) => {
            const keys = providerSecretMap[provider.id] ?? [];
            const keyCount = keys.length;
            const isConfigured = configuredProviders.has(provider.id);

            return (
              <div
                key={provider.id}
                className="flex items-center justify-between px-4 py-3 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <img
                    src={resolveIconPath(provider.icon)}
                    alt={provider.name}
                    className="h-8 w-8 rounded flex-shrink-0"
                  />

                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="font-medium text-sm truncate">{provider.name}</span>
                    {keyCount > 0 && (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Check className="h-3 w-3" />
                        {keyCount} key{keyCount === 1 ? '' : 's'}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex-shrink-0">
                  {provider.requires_api_key && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenProvider(provider)}
                    >
                      {isConfigured ? 'Manage' : 'Add'}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={!!selectedProvider} onOpenChange={(open) => !open && handleCloseDialog()}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Manage {selectedProvider?.name} API Keys
            </DialogTitle>
            <DialogDescription>
              Add multiple API keys and select which one to use by default.
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

          <div className="space-y-3 py-4">
            {providerKeys.length === 0 ? (
              <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                No API keys yet. Add your first key to start using {selectedProvider?.name}.
              </div>
            ) : (
              <div className="space-y-2">
                {providerKeys.map((secret) => {
                  const selected = secret.name === effectiveSelection;
                  return (
                    <div
                      key={secret.name}
                      className={cn(
                        'flex items-center justify-between p-3 border rounded-lg',
                        selected && 'border-primary bg-accent/50'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        {selected && <Check className="h-4 w-4 text-primary" />}
                        <div>
                          <div className="font-medium">
                            {secret.label || 'Unnamed key'}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {maskApiKey(secret.value)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {!selected && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleSelectKey(secret.name)}
                          >
                            Select
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditKey(secret)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={isDeleting}
                          onClick={() => handleDeleteKey(secret.name)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <Button variant="outline" className="w-full" onClick={openAddKeyForm}>
            <Plus className="h-4 w-4 mr-2" />
            Add API Key
          </Button>
        </DialogContent>
      </Dialog>

      <Dialog open={showKeyForm} onOpenChange={handleKeyFormOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSecret ? 'Edit API Key' : 'Add API Key'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="api-key-label">Label</Label>
              <Input
                id="api-key-label"
                placeholder="e.g., Personal, Work, Client A"
                value={keyLabel}
                onChange={(e) => setKeyLabel(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="api-key-value">API Key</Label>
              <div className="relative">
                <Input
                  id="api-key-value"
                  type={showPassword ? 'text' : 'password'}
                  value={keyValue}
                  onChange={(e) => setKeyValue(e.target.value)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Your API key is stored securely and only used for requests to {selectedProvider?.name}.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input
                id="set-as-default"
                type="checkbox"
                className="h-4 w-4"
                checked={setAsDefault}
                onChange={(e) => setSetAsDefault(e.target.checked)}
              />
              <Label htmlFor="set-as-default" className="text-sm">
                Set as selected key
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => handleKeyFormOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveKey} disabled={!keyValue.trim() || isSaving}>
              {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

function buildSecretName(
  base: string,
  label: string,
  existingSecrets: SecretWithValue[]
): string {
  const slug = slugify(label || 'default');
  const initial = `${base}:${slug}`.slice(0, 64);
  let candidate = initial;
  let counter = 2;
  const existingNames = new Set(existingSecrets.map((secret) => secret.name));

  while (existingNames.has(candidate)) {
    const suffix = `-${counter}`;
    const maxLength = 64 - suffix.length;
    candidate = `${initial.slice(0, maxLength)}${suffix}`;
    counter += 1;
  }

  return candidate;
}

function maskApiKey(value: string): string {
  if (value.length < 8) {
    return '••••••••';
  }

  return `${value.slice(0, 4)}••••••••${value.slice(-4)}`;
}
