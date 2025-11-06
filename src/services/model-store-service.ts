/**
 * Model Store Service
 * Loads and indexes data from the model-store submodule
 */

import type {
  Maker,
  Provider,
  Model,
  CloudModel,
  LocalModel,
  ModelStoreData,
  ModelFilters,
} from '@/types/model-store';
import {
  loadAllMakers,
  loadAllProviders,
  loadAllCloudModels,
  loadAllLocalModels,
} from '@/data/models';

/**
 * Load all makers from the model-store
 */
async function fetchMakers(): Promise<Map<string, Maker>> {
  const makers = new Map<string, Maker>();
  const makerList = await loadAllMakers();

  for (const maker of makerList) {
    makers.set(maker.id, maker);
  }

  return makers;
}

/**
 * Load all providers from the model-store
 */
async function fetchProviders(): Promise<Map<string, Provider>> {
  const providers = new Map<string, Provider>();
  const providerList = await loadAllProviders();

  for (const provider of providerList) {
    providers.set(provider.id, provider);
  }

  return providers;
}

/**
 * Load all cloud models from the model-store
 */
async function fetchCloudModels(): Promise<CloudModel[]> {
  return await loadAllCloudModels();
}

/**
 * Load all local models from the model-store
 */
async function fetchLocalModels(): Promise<LocalModel[]> {
  return await loadAllLocalModels();
}

/**
 * Build indexes from loaded data
 */
function buildIndexes(
  makers: Map<string, Maker>,
  providers: Map<string, Provider>,
  models: Model[]
): ModelStoreData {
  const modelsMap = new Map<string, Model>();
  const modelsByMaker = new Map<string, Model[]>();
  const providersByModel = new Map<string, Provider[]>();

  for (const model of models) {
    // Index by model ID
    modelsMap.set(model.id, model);

    // Index by maker
    if (!modelsByMaker.has(model.maker)) {
      modelsByMaker.set(model.maker, []);
    }
    modelsByMaker.get(model.maker)!.push(model);

    // Index providers for this model
    const modelProviders: Provider[] = [];
    for (const mp of model.providers) {
      const provider = providers.get(mp.id);
      if (provider) {
        modelProviders.push(provider);
      }
    }
    providersByModel.set(model.id, modelProviders);
  }

  return {
    makers,
    providers,
    models: modelsMap,
    modelsByMaker,
    providersByModel,
  };
}

/**
 * Filter models based on criteria
 */
export function filterModels(
  models: Model[],
  filters: ModelFilters
): Model[] {
  let filtered = [...models];

  // Filter by search query
  if (filters.search) {
    const query = filters.search.toLowerCase();
    filtered = filtered.filter(
      (m) =>
        m.name.toLowerCase().includes(query) ||
        m.id.toLowerCase().includes(query) ||
        m.description.toLowerCase().includes(query)
    );
  }

  // Filter by capability
  if (filters.capability && filters.capability !== 'all') {
    filtered = filtered.filter((m) =>
      m.capabilities.includes(filters.capability!)
    );
  }

  // Filter by provider
  if (filters.provider) {
    filtered = filtered.filter((m) =>
      m.providers.some((p) => p.id === filters.provider)
    );
  }

  // Filter by type (cloud/local)
  if (filters.type && filters.type !== 'all') {
    if (filters.type === 'cloud') {
      filtered = filtered.filter((m) => 'pricing' in m);
    } else if (filters.type === 'local') {
      filtered = filtered.filter((m) => 'quantization' in m);
    }
  }

  return filtered;
}

/**
 * Get user's configured providers
 * Checks which providers the user has API keys configured for
 */
export function getUserConfiguredProviders(
  providers: Provider[],
  userSecrets: Record<string, string>
): Set<string> {
  const configured = new Set<string>();

  for (const provider of providers) {
    // Local providers (like llama-cpp) don't require API keys
    if (!provider.requires_api_key) {
      configured.add(provider.id);
      continue;
    }

    // Check if user has this provider's API key
    if (userSecrets[provider.requires_api_key]) {
      configured.add(provider.id);
    }
  }

  return configured;
}

/**
 * Main service class for model-store data
 */
class ModelStoreService {
  private data: ModelStoreData | null = null;
  private loading = false;
  private loadPromise: Promise<ModelStoreData> | null = null;

  /**
   * Load all model-store data
   * Uses caching to avoid re-fetching
   */
  async load(): Promise<ModelStoreData> {
    // Return cached data if available
    if (this.data) {
      return this.data;
    }

    // Return existing load promise if already loading
    if (this.loadPromise) {
      return this.loadPromise;
    }

    // Start loading
    this.loading = true;
    this.loadPromise = this._doLoad();

    try {
      this.data = await this.loadPromise;
      return this.data;
    } finally {
      this.loading = false;
      this.loadPromise = null;
    }
  }

  private async _doLoad(): Promise<ModelStoreData> {
    console.log('Loading model-store data...');

    // Load all data in parallel
    const [makers, providers, cloudModels, localModels] = await Promise.all([
      fetchMakers(),
      fetchProviders(),
      fetchCloudModels(),
      fetchLocalModels(),
    ]);

    // Combine all models
    const allModels = [...cloudModels, ...localModels];

    // Build indexes
    const data = buildIndexes(makers, providers, allModels);

    console.log(
      `Loaded ${makers.size} makers, ${providers.size} providers, ${allModels.length} models`
    );

    return data;
  }

  /**
   * Get all makers
   */
  getMakers(): Maker[] {
    return this.data ? Array.from(this.data.makers.values()) : [];
  }

  /**
   * Get maker by ID
   */
  getMaker(id: string): Maker | undefined {
    return this.data?.makers.get(id);
  }

  /**
   * Get all providers
   */
  getProviders(): Provider[] {
    return this.data ? Array.from(this.data.providers.values()) : [];
  }

  /**
   * Get provider by ID
   */
  getProvider(id: string): Provider | undefined {
    return this.data?.providers.get(id);
  }

  /**
   * Get all models
   */
  getModels(): Model[] {
    return this.data ? Array.from(this.data.models.values()) : [];
  }

  /**
   * Get model by ID
   */
  getModel(id: string): Model | undefined {
    return this.data?.models.get(id);
  }

  /**
   * Get models by maker ID
   */
  getModelsByMaker(makerId: string): Model[] {
    return this.data?.modelsByMaker.get(makerId) || [];
  }

  /**
   * Get providers for a specific model
   */
  getProvidersForModel(modelId: string): Provider[] {
    return this.data?.providersByModel.get(modelId) || [];
  }

  /**
   * Check if data is loaded
   */
  isLoaded(): boolean {
    return this.data !== null;
  }

  /**
   * Check if data is currently loading
   */
  isLoading(): boolean {
    return this.loading;
  }

  /**
   * Clear cached data (useful for testing/development)
   */
  clear(): void {
    this.data = null;
    this.loading = false;
    this.loadPromise = null;
  }
}

// Export singleton instance
export const modelStoreService = new ModelStoreService();
