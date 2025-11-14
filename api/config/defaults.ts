/**
 * Default Configuration Barrel Export
 *
 * Centralized exports for all default configurations.
 * This makes it easy to import defaults throughout the codebase.
 *
 * Usage:
 *   import { DEFAULT_MODELS, DEFAULT_PROVIDERS, DEFAULT_PROVIDER_CONFIGS } from '../config/defaults'
 */

// Re-export models
export {
  DEFAULT_LOCAL_MODELS,
  DEFAULT_EMBEDDING_MODELS,
  DEFAULT_TASK_MODELS,
  AVAILABLE_CLOUD_MODELS,
  getDefaultPrimaryChatModels,
  getDefaultEmbeddingModels,
  getAllAvailableModels,
  getModelById,
  modelRequiresApiKey,
  extractProvider,
  getApiKeyForProvider,
  type ModelDefinition,
} from './default-models'

// Re-export providers
export {
  DEFAULT_PROVIDERS,
  ALTERNATIVE_PROVIDERS,
  getProviderDependencies,
  getAllProviderDependencies,
  type ProviderDefaults,
} from './default-providers'

// Re-export provider configs
export {
  DEFAULT_PROVIDER_CONFIGS,
  ALTERNATIVE_CONFIGS,
  getProviderConfig,
  validateProviderConfig,
  type ProviderConfig,
} from './default-provider-configs'
