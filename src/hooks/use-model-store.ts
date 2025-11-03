/**
 * React hook for accessing model-store data
 */

import { useState, useEffect } from 'react';
import { modelStoreService } from '@/services/model-store-service';
import type {
  Maker,
  Provider,
  Model,
  ModelFilters,
} from '@/types/model-store';
import { filterModels } from '@/services/model-store-service';

/**
 * Hook to load and access all model-store data
 */
export function useModelStore() {
  const [isLoading, setIsLoading] = useState(!modelStoreService.isLoaded());
  const [makers, setMakers] = useState<Maker[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [models, setModels] = useState<Model[]>([]);

  useEffect(() => {
    async function loadData() {
      if (modelStoreService.isLoaded()) {
        // Data already loaded, use cached data
        setMakers(modelStoreService.getMakers());
        setProviders(modelStoreService.getProviders());
        setModels(modelStoreService.getModels());
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        await modelStoreService.load();
        setMakers(modelStoreService.getMakers());
        setProviders(modelStoreService.getProviders());
        setModels(modelStoreService.getModels());
      } catch (error) {
        console.error('Failed to load model-store data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  return {
    isLoading,
    makers,
    providers,
    models,
    getMaker: (id: string) => modelStoreService.getMaker(id),
    getProvider: (id: string) => modelStoreService.getProvider(id),
    getModel: (id: string) => modelStoreService.getModel(id),
    getModelsByMaker: (makerId: string) =>
      modelStoreService.getModelsByMaker(makerId),
    getProvidersForModel: (modelId: string) =>
      modelStoreService.getProvidersForModel(modelId),
  };
}

/**
 * Hook to get filtered models
 */
export function useFilteredModels(filters: ModelFilters) {
  const { models, isLoading } = useModelStore();
  const [filteredModels, setFilteredModels] = useState<Model[]>([]);

  useEffect(() => {
    if (!isLoading) {
      const filtered = filterModels(models, filters);
      setFilteredModels(filtered);
    }
  }, [models, filters, isLoading]);

  return {
    models: filteredModels,
    isLoading,
  };
}

/**
 * Hook to get a specific model by ID
 */
export function useModel(modelId: string | undefined) {
  const { getModel, getProvidersForModel, isLoading } = useModelStore();
  const [model, setModel] = useState<Model | undefined>(undefined);
  const [providers, setProviders] = useState<Provider[]>([]);

  useEffect(() => {
    if (!isLoading && modelId) {
      const m = getModel(modelId);
      setModel(m);
      if (m) {
        setProviders(getProvidersForModel(modelId));
      }
    }
  }, [modelId, isLoading, getModel, getProvidersForModel]);

  return {
    model,
    providers,
    isLoading,
  };
}

/**
 * Hook to get models by maker
 */
export function useModelsByMaker(makerId: string | undefined) {
  const { getModelsByMaker, getMaker, isLoading } = useModelStore();
  const [models, setModels] = useState<Model[]>([]);
  const [maker, setMaker] = useState<Maker | undefined>(undefined);

  useEffect(() => {
    if (!isLoading && makerId) {
      setModels(getModelsByMaker(makerId));
      setMaker(getMaker(makerId));
    }
  }, [makerId, isLoading, getModelsByMaker, getMaker]);

  return {
    models,
    maker,
    isLoading,
  };
}
