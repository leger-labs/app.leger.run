/**
 * Model store data loaders
 * Lazy-loads model, maker, and provider definitions from JSON files
 */

import type { CloudModel, LocalModel, Maker, Provider } from '@/types/model-store';

/**
 * Import all model JSON files using Vite's glob import
 */
const cloudModelFiles = import.meta.glob<CloudModel>('./cloud/*.json', {
  import: 'default',
});

const localModelFiles = import.meta.glob<LocalModel>('./local/*.json', {
  import: 'default',
});

const makerFiles = import.meta.glob<Maker>('./makers/*.json', {
  import: 'default',
});

const providerFiles = import.meta.glob<Provider>('./providers/*.json', {
  import: 'default',
});

/**
 * Extract ID from path
 * "./cloud/claude-sonnet-4-5.json" -> "claude-sonnet-4-5"
 */
function extractId(path: string): string {
  return path.split('/').pop()!.replace('.json', '');
}

/**
 * Get list of all available cloud model IDs
 */
export function getCloudModelIds(): string[] {
  return Object.keys(cloudModelFiles).map(extractId);
}

/**
 * Get list of all available local model IDs
 */
export function getLocalModelIds(): string[] {
  return Object.keys(localModelFiles).map(extractId);
}

/**
 * Get list of all available maker IDs
 */
export function getMakerIds(): string[] {
  return Object.keys(makerFiles).map(extractId);
}

/**
 * Get list of all available provider IDs
 */
export function getProviderIds(): string[] {
  return Object.keys(providerFiles).map(extractId);
}

/**
 * Load a single cloud model by ID
 */
export async function loadCloudModel(
  modelId: string
): Promise<CloudModel | null> {
  const path = `./cloud/${modelId}.json`;
  const loader = cloudModelFiles[path];

  if (!loader) {
    console.warn(`Cloud model not found: ${modelId}`);
    return null;
  }

  try {
    return await loader();
  } catch (error) {
    console.error(`Failed to load cloud model ${modelId}:`, error);
    return null;
  }
}

/**
 * Load a single local model by ID
 */
export async function loadLocalModel(
  modelId: string
): Promise<LocalModel | null> {
  const path = `./local/${modelId}.json`;
  const loader = localModelFiles[path];

  if (!loader) {
    console.warn(`Local model not found: ${modelId}`);
    return null;
  }

  try {
    return await loader();
  } catch (error) {
    console.error(`Failed to load local model ${modelId}:`, error);
    return null;
  }
}

/**
 * Load a single maker by ID
 */
export async function loadMaker(makerId: string): Promise<Maker | null> {
  const path = `./makers/${makerId}.json`;
  const loader = makerFiles[path];

  if (!loader) {
    console.warn(`Maker not found: ${makerId}`);
    return null;
  }

  try {
    return await loader();
  } catch (error) {
    console.error(`Failed to load maker ${makerId}:`, error);
    return null;
  }
}

/**
 * Load a single provider by ID
 */
export async function loadProvider(providerId: string): Promise<Provider | null> {
  const path = `./providers/${providerId}.json`;
  const loader = providerFiles[path];

  if (!loader) {
    console.warn(`Provider not found: ${providerId}`);
    return null;
  }

  try {
    return await loader();
  } catch (error) {
    console.error(`Failed to load provider ${providerId}:`, error);
    return null;
  }
}

/**
 * Load all cloud models
 */
export async function loadAllCloudModels(): Promise<CloudModel[]> {
  const models: CloudModel[] = [];

  for (const [path, loader] of Object.entries(cloudModelFiles)) {
    try {
      const model = await loader();
      models.push(model);
    } catch (error) {
      console.error(`Failed to load cloud model from ${path}:`, error);
    }
  }

  return models;
}

/**
 * Load all local models
 */
export async function loadAllLocalModels(): Promise<LocalModel[]> {
  const models: LocalModel[] = [];

  for (const [path, loader] of Object.entries(localModelFiles)) {
    try {
      const model = await loader();
      models.push(model);
    } catch (error) {
      console.error(`Failed to load local model from ${path}:`, error);
    }
  }

  return models;
}

/**
 * Load all makers
 */
export async function loadAllMakers(): Promise<Maker[]> {
  const makers: Maker[] = [];

  for (const [path, loader] of Object.entries(makerFiles)) {
    try {
      const maker = await loader();
      makers.push(maker);
    } catch (error) {
      console.error(`Failed to load maker from ${path}:`, error);
    }
  }

  return makers;
}

/**
 * Load all providers
 */
export async function loadAllProviders(): Promise<Provider[]> {
  const providers: Provider[] = [];

  for (const [path, loader] of Object.entries(providerFiles)) {
    try {
      const provider = await loader();
      providers.push(provider);
    } catch (error) {
      console.error(`Failed to load provider from ${path}:`, error);
    }
  }

  return providers;
}
