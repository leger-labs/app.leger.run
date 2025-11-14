/**
 * Config Generator Service
 * Combines Release + Settings + Marketplace + Models + Secrets → user-config.json
 *
 * This implements the "last mile" concept:
 * - Release config: User's composition choices (which providers, which models)
 * - Settings: Tailscale configuration (one-time setup)
 * - Marketplace: Full provider configurations
 * - Models: Model details from model store
 * - Secrets: API keys from secrets store
 *
 * Output: Complete user-config.json ready for template rendering
 */

import type { Env } from '../middleware/auth'
import type { ReleaseConfig, UserConfig, TailscaleConfig } from '../models/release-config'
import { getParsedConfiguration } from './configurations'
import { listSecrets } from './secrets'
import {
  DEFAULT_PROVIDERS,
  DEFAULT_PROVIDER_CONFIGS,
  getDefaultPrimaryChatModels,
  getDefaultEmbeddingModels,
} from '../config/defaults'

/**
 * Settings data (Tailscale configuration)
 * For v1, this is stored in a simple KV structure
 * In the future, this could be expanded to a full settings service
 */
interface SettingsData {
  tailscale: TailscaleConfig
}

/**
 * Get user settings (Tailscale config)
 */
async function getUserSettings(
  env: Env,
  userUuid: string
): Promise<SettingsData | null> {
  const settingsKey = `settings:${userUuid}`
  const settings = await env.LEGER_SECRETS.get(settingsKey, 'json')

  if (!settings) {
    return null
  }

  return settings as SettingsData
}

/**
 * Get all user secrets as key-value object
 */
async function getUserSecrets(
  env: Env,
  userUuid: string
): Promise<Record<string, string>> {
  const secrets = await listSecrets(env, userUuid, true)

  const secretsObj: Record<string, string> = {}
  for (const secret of secrets) {
    if ('value' in secret && secret.value) {
      secretsObj[secret.name] = secret.value
    }
  }

  return secretsObj
}

/**
 * Get marketplace service configuration
 * For now, this is a placeholder - in a full implementation,
 * this would fetch from a marketplace service
 */
async function getMarketplaceServiceConfig(
  env: Env,
  userUuid: string,
  serviceId: string
): Promise<Record<string, any> | null> {
  // TODO: Implement marketplace service fetching
  // For now, return default configs based on service ID

  const defaultConfigs: Record<string, any> = {
    qdrant: {
      container_name: 'qdrant',
      hostname: 'qdrant',
      port: 6333,
      external_subdomain: 'qdrant',
      volume: 'qdrant.volume',
    },
    searxng: {
      container_name: 'searxng',
      hostname: 'searxng',
      port: 8080,
      external_subdomain: 'search',
      volume: 'searxng.volume',
    },
    comfyui: {
      container_name: 'comfyui',
      hostname: 'comfyui',
      port: 8188,
      external_subdomain: 'comfy',
      websocket: true,
    },
    whisper: {
      container_name: 'whisper',
      hostname: 'whisper',
      port: 9000,
      external_subdomain: 'whisper',
    },
    jupyter: {
      container_name: 'jupyter',
      hostname: 'jupyter',
      port: 8888,
      external_subdomain: 'jupyter',
      volume: 'jupyter.volume',
    },
  }

  return defaultConfigs[serviceId] || null
}

/**
 * Build infrastructure.services object with core + selected services
 */
function buildInfrastructureServices(
  releaseConfig: ReleaseConfig,
  marketplaceConfigs: Record<string, any>
): Record<string, any> {
  const services: Record<string, any> = {
    // Core services (always included)
    caddy: {
      container_name: 'caddy',
      hostname: 'caddy',
      port: 443,
      published_port: 443,
      bind_address: '0.0.0.0',
      external_subdomain: null,
      description: 'Caddy Reverse Proxy for LLM Services',
    },
    cockpit: {
      container_name: 'cockpit',
      hostname: 'host',
      port: 9090,
      published_port: 9090,
      bind_address: '127.0.0.1',
      external_subdomain: releaseConfig.caddy_routes.cockpit_subdomain || 'cockpit',
      description: 'Cockpit Web Console',
    },
    openwebui: {
      container_name: 'openwebui',
      hostname: 'openwebui',
      port: 8080,
      published_port: 3000,
      bind_address: '127.0.0.1',
      external_subdomain: releaseConfig.caddy_routes.openwebui_subdomain,
      volume: 'openwebui.volume',
      websocket: true,
      description: 'Open WebUI - LLM Chat Interface',
      ...releaseConfig.core_services.openwebui,
    },
    'openwebui-postgres': {
      container_name: 'openwebui-postgres',
      hostname: 'openwebui-postgres',
      port: 5432,
      volume: 'openwebui-postgres.volume',
      db_name: 'openwebui',
      db_user: 'openwebui',
      description: 'PostgreSQL for OpenWebUI',
    },
    'openwebui-redis': {
      container_name: 'openwebui-redis',
      hostname: 'openwebui-redis',
      port: 6379,
      volume: 'openwebui-redis.volume',
      description: 'Redis for OpenWebUI',
    },
    litellm: {
      container_name: 'litellm',
      hostname: 'litellm',
      port: 4000,
      published_port: 4000,
      bind_address: '127.0.0.1',
      external_subdomain: releaseConfig.caddy_routes.litellm_subdomain,
      description: 'LiteLLM - Unified LLM Proxy',
      ...releaseConfig.core_services.litellm,
    },
    'litellm-postgres': {
      container_name: 'litellm-postgres',
      hostname: 'litellm-postgres',
      port: 5432,
      volume: 'litellm-postgres.volume',
      db_name: 'litellm',
      db_user: 'litellm',
      description: 'PostgreSQL for LiteLLM',
    },
    'litellm-redis': {
      container_name: 'litellm-redis',
      hostname: 'litellm-redis',
      port: 6379,
      volume: 'litellm-redis.volume',
      description: 'Redis for LiteLLM',
    },
    'llama-swap': {
      container_name: 'llama-swap',
      hostname: 'llama-swap',
      port: 8000,
      published_port: 8000,
      bind_address: '127.0.0.1',
      external_subdomain: releaseConfig.caddy_routes.llama_swap_subdomain,
      volume: 'llama-swap.volume',
      description: 'Llama-Swap - Local Model Router',
      ...releaseConfig.core_services.llama_swap,
    },
  }

  // Add selected marketplace services
  const selections = releaseConfig.service_selections

  if (selections.rag_provider && marketplaceConfigs[selections.rag_provider]) {
    services[selections.rag_provider] = {
      ...marketplaceConfigs[selections.rag_provider],
      external_subdomain: releaseConfig.caddy_routes.qdrant_subdomain || marketplaceConfigs[selections.rag_provider].external_subdomain,
    }
  }

  if (selections.web_search_provider && marketplaceConfigs[selections.web_search_provider]) {
    services[selections.web_search_provider] = {
      ...marketplaceConfigs[selections.web_search_provider],
      external_subdomain: releaseConfig.caddy_routes.searxng_subdomain || marketplaceConfigs[selections.web_search_provider].external_subdomain,
    }
  }

  if (selections.image_generation_provider && marketplaceConfigs[selections.image_generation_provider]) {
    services[selections.image_generation_provider] = {
      ...marketplaceConfigs[selections.image_generation_provider],
      external_subdomain: releaseConfig.caddy_routes.comfyui_subdomain || marketplaceConfigs[selections.image_generation_provider].external_subdomain,
    }
  }

  if (selections.stt_provider && marketplaceConfigs[selections.stt_provider]) {
    services[selections.stt_provider] = {
      ...marketplaceConfigs[selections.stt_provider],
      external_subdomain: releaseConfig.caddy_routes.whisper_subdomain || marketplaceConfigs[selections.stt_provider].external_subdomain,
    }
  }

  if (selections.code_execution_provider && marketplaceConfigs[selections.code_execution_provider]) {
    services[selections.code_execution_provider] = {
      ...marketplaceConfigs[selections.code_execution_provider],
      external_subdomain: releaseConfig.caddy_routes.jupyter_subdomain || marketplaceConfigs[selections.code_execution_provider].external_subdomain,
    }
  }

  return services
}

/**
 * Build features object based on release configuration
 * Uses intelligent defaults and infers from provider selections
 */
function buildFeatures(
  releaseConfig: ReleaseConfig,
  providers: Record<string, string>
): Record<string, boolean> {
  const features: Record<string, boolean> = {
    // Task model features (enabled by default with default task models)
    title_generation: true,
    autocomplete_generation: true,
    tags_generation: true,
    websocket_support: true,
  }

  // Features are auto-enabled based on provider selections
  // This provides "zero-config" experience - if provider is set, feature works

  if (providers.vector_db) {
    features.rag_enabled = true
  }

  if (providers.web_search_engine) {
    features.web_search_enabled = true
  }

  if (providers.image_engine) {
    features.image_generation_enabled = true
  }

  if (providers.stt_engine) {
    features.stt_enabled = true
  }

  if (providers.tts_engine) {
    features.tts_enabled = true
  }

  if (providers.code_execution_engine) {
    features.code_execution_enabled = true
  }

  // Allow explicit overrides from release config (if specified)
  const openwebuiConfig = releaseConfig.core_services.openwebui || {}

  if (openwebuiConfig.enable_rag !== undefined) {
    features.rag_enabled = openwebuiConfig.enable_rag
  }

  if (openwebuiConfig.enable_web_search !== undefined) {
    features.web_search_enabled = openwebuiConfig.enable_web_search
  }

  if (openwebuiConfig.enable_image_generation !== undefined) {
    features.image_generation_enabled = openwebuiConfig.enable_image_generation
  }

  return features
}

/**
 * Build providers object mapping categories to selected provider IDs
 * Uses intelligent defaults and allows user overrides
 */
function buildProviders(releaseConfig: ReleaseConfig): Record<string, string> {
  // Start with intelligent defaults
  const providers: Record<string, string> = { ...DEFAULT_PROVIDERS }

  // Override with user selections (if provided)
  const selections = releaseConfig.service_selections

  if (selections.rag_provider) {
    providers.vector_db = selections.rag_provider
  }

  if (selections.web_search_provider) {
    providers.web_search_engine = selections.web_search_provider
  }

  if (selections.image_generation_provider) {
    providers.image_engine = selections.image_generation_provider
  }

  if (selections.stt_provider) {
    providers.stt_engine = selections.stt_provider
  }

  if (selections.tts_provider) {
    providers.tts_engine = selections.tts_provider
  }

  if (selections.code_execution_provider) {
    providers.code_execution_engine = selections.code_execution_provider
  }

  if (selections.extraction_provider) {
    providers.content_extraction = selections.extraction_provider
  }

  if (selections.storage_provider) {
    providers.storage_provider = selections.storage_provider
  }

  // Remove null values (features disabled by default)
  return Object.fromEntries(
    Object.entries(providers).filter(([_, value]) => value !== null)
  )
}

/**
 * Build provider_config object with all provider-specific settings
 * Uses comprehensive defaults and allows granular user overrides
 */
function buildProviderConfig(releaseConfig: ReleaseConfig): Record<string, any> {
  // Start with comprehensive defaults
  const providerConfig: Record<string, any> = { ...DEFAULT_PROVIDER_CONFIGS }

  // Override with user-specified OpenWebUI settings
  const openwebuiConfig = releaseConfig.core_services.openwebui || {}

  if (openwebuiConfig.webui_name) {
    providerConfig.webui_name = openwebuiConfig.webui_name
  }

  if (openwebuiConfig.custom_name) {
    providerConfig.custom_name = openwebuiConfig.custom_name
  }

  if (openwebuiConfig.rag_top_k) {
    providerConfig.rag_top_k = openwebuiConfig.rag_top_k
  }

  if (openwebuiConfig.chunk_size) {
    providerConfig.chunk_size = openwebuiConfig.chunk_size
  }

  if (openwebuiConfig.chunk_overlap) {
    providerConfig.chunk_overlap = openwebuiConfig.chunk_overlap
  }

  if (openwebuiConfig.task_model_title) {
    providerConfig.task_model_title = openwebuiConfig.task_model_title
  }

  if (openwebuiConfig.task_model_tags) {
    providerConfig.task_model_tags = openwebuiConfig.task_model_tags
  }

  if (openwebuiConfig.task_model_autocomplete) {
    providerConfig.task_model_autocomplete = openwebuiConfig.task_model_autocomplete
  }

  if (openwebuiConfig.task_model_query) {
    providerConfig.task_model_query = openwebuiConfig.task_model_query
  }

  if (openwebuiConfig.task_model_search_query) {
    providerConfig.task_model_search_query = openwebuiConfig.task_model_search_query
  }

  if (openwebuiConfig.task_model_rag_template) {
    providerConfig.task_model_rag_template = openwebuiConfig.task_model_rag_template
  }

  if (openwebuiConfig.log_level) {
    providerConfig.log_level = openwebuiConfig.log_level
  }

  if (openwebuiConfig.redis_key_prefix) {
    providerConfig.redis_key_prefix = openwebuiConfig.redis_key_prefix
  }

  if (openwebuiConfig.timeout_start) {
    providerConfig.openwebui_timeout_start = openwebuiConfig.timeout_start
  }

  // Add provider-specific URLs (these are auto-generated based on infrastructure)
  const selections = releaseConfig.service_selections

  if (selections.rag_provider === 'qdrant') {
    providerConfig.qdrant_url = 'http://qdrant:6333'
    providerConfig.qdrant_api_key = ''
  }

  if (selections.web_search_provider === 'searxng') {
    providerConfig.searxng_query_url = 'http://searxng:8080/search?q=<query>'
  }

  if (selections.extraction_provider === 'tika') {
    providerConfig.tika_server_url = 'http://tika:9998'
  } else if (selections.extraction_provider === 'docling') {
    providerConfig.docling_server_url = 'http://docling:5001'
  }

  return providerConfig
}

/**
 * Generate complete user-config.json from release and other data sources
 */
export async function generateUserConfig(
  env: Env,
  userUuid: string,
  releaseId: string
): Promise<UserConfig> {
  // 1. Load release configuration
  const releaseConfigData = await getParsedConfiguration(env, userUuid, releaseId)

  if (!releaseConfigData) {
    throw new Error('Release configuration not found')
  }

  // Type assertion - we know this is a ReleaseConfig based on schema version
  const releaseConfig = releaseConfigData as unknown as ReleaseConfig

  // 2. Load settings (Tailscale)
  const settings = await getUserSettings(env, userUuid)

  if (!settings || !settings.tailscale) {
    throw new Error('Tailscale configuration not found in settings. Please configure Tailscale first.')
  }

  // 3. Load marketplace service configurations
  const marketplaceConfigs: Record<string, any> = {}
  const selections = releaseConfig.service_selections

  // Fetch all selected services
  const serviceIds = [
    selections.rag_provider,
    selections.web_search_provider,
    selections.image_generation_provider,
    selections.stt_provider,
    selections.tts_provider,
    selections.code_execution_provider,
    selections.storage_provider,
    selections.extraction_provider,
  ].filter((id): id is string => !!id)

  for (const serviceId of serviceIds) {
    const config = await getMarketplaceServiceConfig(env, userUuid, serviceId)
    if (config) {
      marketplaceConfigs[serviceId] = config
    }
  }

  // 4. Load secrets
  const secrets = await getUserSecrets(env, userUuid)

  // 5. Build providers first (needed for features)
  const providers = buildProviders(releaseConfig)

  // 6. Add default models if none specified
  const models = releaseConfig.model_assignments

  // Use defaults if no models specified
  const cloudModels = models?.primary_chat_models || []
  const localModels = cloudModels.length === 0 ? getDefaultPrimaryChatModels() : []

  const embeddingModels = models?.embedding_models?.length
    ? models.embedding_models
    : getDefaultEmbeddingModels()

  // 7. Combine everything into UserConfig
  const userConfig: UserConfig = {
    tailscale: settings.tailscale,
    infrastructure: {
      network: releaseConfig.infrastructure.network,
      services: buildInfrastructureServices(releaseConfig, marketplaceConfigs),
    },
    features: buildFeatures(releaseConfig, providers),
    providers,
    provider_config: buildProviderConfig(releaseConfig),
    secrets,
    models: {
      cloud: cloudModels,
      local: localModels,
    },
  }

  return userConfig
}

/**
 * Validate that a release config can be generated
 * Checks for required dependencies
 */
export async function validateReleaseConfig(
  env: Env,
  userUuid: string,
  releaseConfig: ReleaseConfig
): Promise<{ valid: boolean; errors: string[]; warnings: string[] }> {
  const errors: string[] = []
  const warnings: string[] = []

  // Check Tailscale configuration exists
  const settings = await getUserSettings(env, userUuid)
  if (!settings || !settings.tailscale) {
    errors.push('Tailscale configuration not found. Please configure Tailscale in Settings first.')
  }

  // Models are now optional - defaults will be used if not specified
  // This allows novice users to deploy with zero configuration

  // RAG dependency check - now just informational since we have defaults
  if (releaseConfig.service_selections.rag_provider) {
    if (!releaseConfig.model_assignments.embedding_models ||
        releaseConfig.model_assignments.embedding_models.length === 0) {
      // Informational only - defaults will be used
      console.log('RAG enabled with default embedding model (qwen3-embedding-8b)')
    }
  }

  // Check for duplicate subdomains
  const subdomains = [
    releaseConfig.caddy_routes.openwebui_subdomain,
    releaseConfig.caddy_routes.litellm_subdomain,
    releaseConfig.caddy_routes.llama_swap_subdomain,
    releaseConfig.caddy_routes.cockpit_subdomain,
    releaseConfig.caddy_routes.qdrant_subdomain,
    releaseConfig.caddy_routes.searxng_subdomain,
    releaseConfig.caddy_routes.comfyui_subdomain,
    releaseConfig.caddy_routes.whisper_subdomain,
    releaseConfig.caddy_routes.jupyter_subdomain,
  ].filter((s): s is string => !!s)

  const duplicates = subdomains.filter((item, index) => subdomains.indexOf(item) !== index)
  if (duplicates.length > 0) {
    errors.push(`Duplicate subdomains found: ${duplicates.join(', ')}`)
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}
