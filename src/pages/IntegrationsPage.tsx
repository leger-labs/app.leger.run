/**
 * Integrations Page
 * Manage AI provider integrations and API keys
 */

import { useState, useEffect, useMemo } from 'react';
import { Loader2, ExternalLink, Check, Plus, Eye, EyeOff, Search, FileX } from 'lucide-react';
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
import type { Provider } from '@/types/model-store';

export function IntegrationsPage() {
  const { providers, isLoading: isLoadingModelStore } = useModelStore();
  const { secrets, isLoading: isLoadingSecrets, upsertSecret } = useSecrets();

  const [search, setSearch] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'configured' | 'available'>('all');
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [apiKeyValue, setApiKeyValue] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
  const [showPassword, setShowPassword] = useState(false);
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
    setIsEditMode(false);
    setShowPassword(false);
    setTestResult(null);
  };

  const handleEditProvider = (provider: Provider) => {
    setSelectedProvider(provider);
    // Load existing API key value
    const existingSecret = secrets.find((s) => s.name === provider.requires_api_key);
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
    if (!selectedProvider || !selectedProvider.requires_api_key) return;

    setIsSaving(true);
    const success = await upsertSecret(selectedProvider.requires_api_key, apiKeyValue);
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
    let filtered = providers;

    // Filter by tab
    if (filterTab === 'configured') {
      filtered = filtered.filter((p) => configuredProviders.has(p.id));
    } else if (filterTab === 'available') {
      filtered = filtered.filter((p) => !configuredProviders.has(p.id));
    }

    // Filter by search
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
          title="Integrations"
          description="Use your own provider API keys to access AI Gateway with automatic fallback."
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
        title="Integrations"
        description="Use your own provider API keys to access AI Gateway with automatic fallback."
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
                    src={`/${provider.icon}`}
                    alt={provider.name}
                    className="h-8 w-8 rounded flex-shrink-0"
                  />

                  {/* Center: Name and Badge */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="font-medium text-sm truncate">{provider.name}</span>
                    {isConfigured && (
                      <Badge variant="secondary" className="flex items-center gap-1 flex-shrink-0">
                        <Check className="h-3 w-3" />
                        Configured
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Right: Add/Edit Button */}
                <div className="flex-shrink-0">
                  {provider.requires_api_key && (
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
