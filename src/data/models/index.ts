/**
 * Model store data loaders
 * Provides access to the pre-bundled model, maker, and provider definitions
 */

import modelStoreBundleRaw from '@/generated/model-store-data.json';
import type { CloudModel, LocalModel, Maker, Provider } from '@/types/model-store';

type ModelStoreBundle = {
  cloudModelCount: number;
  localModelCount: number;
  makerCount: number;
  providerCount: number;
  cloudModels: CloudModel[];
  localModels: LocalModel[];
  makers: Maker[];
  providers: Provider[];
};

const modelStoreBundle = modelStoreBundleRaw as ModelStoreBundle;

const cloudModelsById = new Map(
  modelStoreBundle.cloudModels.map((model) => [model.id, model])
);
const localModelsById = new Map(
  modelStoreBundle.localModels.map((model) => [model.id, model])
);
const makersById = new Map(
  modelStoreBundle.makers.map((maker) => [maker.id, maker])
);
const providersById = new Map(
  modelStoreBundle.providers.map((provider) => [provider.id, provider])
);

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

/**
 * Get list of all available cloud model IDs
 */
export function getCloudModelIds(): string[] {
  return modelStoreBundle.cloudModels.map((model) => model.id);
}

/**
 * Get list of all available local model IDs
 */
export function getLocalModelIds(): string[] {
  return modelStoreBundle.localModels.map((model) => model.id);
}

/**
 * Get list of all available maker IDs
 */
export function getMakerIds(): string[] {
  return modelStoreBundle.makers.map((maker) => maker.id);
}

/**
 * Get list of all available provider IDs
 */
export function getProviderIds(): string[] {
  return modelStoreBundle.providers.map((provider) => provider.id);
}

/**
 * Load a single cloud model by ID
 */
export async function loadCloudModel(
  modelId: string
): Promise<CloudModel | null> {
  const model = cloudModelsById.get(modelId);

  if (!model) {
    console.warn(`Cloud model not found: ${modelId}`);
    return null;
  }

  return clone(model);
}

/**
 * Load a single local model by ID
 */
export async function loadLocalModel(
  modelId: string
): Promise<LocalModel | null> {
  const model = localModelsById.get(modelId);

  if (!model) {
    console.warn(`Local model not found: ${modelId}`);
    return null;
  }

  return clone(model);
}

/**
 * Load a single maker by ID
 */
export async function loadMaker(makerId: string): Promise<Maker | null> {
  const maker = makersById.get(makerId);

  if (!maker) {
    console.warn(`Maker not found: ${makerId}`);
    return null;
  }

  return clone(maker);
}

/**
 * Load a single provider by ID
 */
export async function loadProvider(providerId: string): Promise<Provider | null> {
  const provider = providersById.get(providerId);

  if (!provider) {
    console.warn(`Provider not found: ${providerId}`);
    return null;
  }

  return clone(provider);
}

/**
 * Load all cloud models
 */
export async function loadAllCloudModels(): Promise<CloudModel[]> {
  return modelStoreBundle.cloudModels.map((model) => clone(model));
}

/**
 * Load all local models
 */
export async function loadAllLocalModels(): Promise<LocalModel[]> {
  return modelStoreBundle.localModels.map((model) => clone(model));
}

/**
 * Load all makers
 */
export async function loadAllMakers(): Promise<Maker[]> {
  return modelStoreBundle.makers.map((maker) => clone(maker));
}

/**
 * Load all providers
 */
export async function loadAllProviders(): Promise<Provider[]> {
  return modelStoreBundle.providers.map((provider) => clone(provider));
}
