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
 */
function buildFeatures(releaseConfig: ReleaseConfig): Record<string, boolean> {
  const features: Record<string, boolean> = {
    title_generation: !!releaseConfig.core_services.openwebui?.task_model_title,
    autocomplete_generation: !!releaseConfig.core_services.openwebui?.task_model_autocomplete,
    tags_generation: !!releaseConfig.core_services.openwebui?.task_model_tags,
    websocket_support: true,
  }

  // Features are enabled based on service selections
  const selections = releaseConfig.service_selections

  if (selections.rag_provider) {
    features.rag_enabled = true
  }

  if (selections.web_search_provider) {
    features.web_search_enabled = true
  }

  if (selections.image_generation_provider) {
    features.image_generation_enabled = true
  }

  if (selections.stt_provider) {
    features.stt_enabled = true
  }

  if (selections.tts_provider) {
    features.tts_enabled = true
  }

  if (selections.code_execution_provider) {
    features.code_execution_enabled = true
  }

  return features
}

/**
 * Build providers object mapping categories to selected provider IDs
 */
function buildProviders(releaseConfig: ReleaseConfig): Record<string, string> {
  const providers: Record<string, string> = {}
  const selections = releaseConfig.service_selections

  if (selections.rag_provider) {
    providers.vector_db = selections.rag_provider
    providers.rag_embedding = 'openai' // Default, could be configurable
  }

  if (selections.web_search_provider) {
    providers.web_search_engine = selections.web_search_provider
    providers.web_loader = 'requests' // Default
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

  return providers
}

/**
 * Build provider_config object with all provider-specific settings
 */
function buildProviderConfig(releaseConfig: ReleaseConfig): Record<string, any> {
  const providerConfig: Record<string, any> = {
    // OpenWebUI core settings
    webui_name: releaseConfig.core_services.openwebui?.webui_name || 'Leger AI',
    custom_name: releaseConfig.core_services.openwebui?.custom_name || '',

    // RAG settings
    rag_top_k: releaseConfig.core_services.openwebui?.rag_top_k || 5,
    chunk_size: releaseConfig.core_services.openwebui?.chunk_size || 1500,
    chunk_overlap: releaseConfig.core_services.openwebui?.chunk_overlap || 100,

    // Task models
    task_model_title: releaseConfig.core_services.openwebui?.task_model_title || 'qwen3-0.6b',
    task_model_tags: releaseConfig.core_services.openwebui?.task_model_tags || 'qwen3-4b',
    task_model_autocomplete: releaseConfig.core_services.openwebui?.task_model_autocomplete || 'qwen3-0.6b',
    task_model_query: releaseConfig.core_services.openwebui?.task_model_query || 'qwen3-4b',
    task_model_search_query: releaseConfig.core_services.openwebui?.task_model_search_query || 'qwen3-4b',
    task_model_rag_template: releaseConfig.core_services.openwebui?.task_model_rag_template || 'qwen3-4b',

    // Logging
    log_level: releaseConfig.core_services.openwebui?.log_level || 'INFO',
    redis_key_prefix: releaseConfig.core_services.openwebui?.redis_key_prefix || 'open-webui',
    openwebui_timeout_start: releaseConfig.core_services.openwebui?.timeout_start || 900,
  }

  // Add provider-specific configs based on selections
  const selections = releaseConfig.service_selections

  if (selections.rag_provider === 'qdrant') {
    providerConfig.qdrant_url = 'http://qdrant:6333'
    providerConfig.qdrant_api_key = ''
    providerConfig.qdrant_grpc_port = 6334
    providerConfig.qdrant_prefer_grpc = false
    providerConfig.qdrant_on_disk = true
  }

  if (selections.web_search_provider === 'searxng') {
    providerConfig.searxng_query_url = 'http://searxng:8080/search?q=<query>'
  }

  if (selections.extraction_provider === 'tika') {
    providerConfig.tika_server_url = 'http://tika:9998'
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

  // 5. Combine everything into UserConfig
  const userConfig: UserConfig = {
    tailscale: settings.tailscale,
    infrastructure: {
      network: releaseConfig.infrastructure.network,
      services: buildInfrastructureServices(releaseConfig, marketplaceConfigs),
    },
    features: buildFeatures(releaseConfig),
    providers: buildProviders(releaseConfig),
    provider_config: buildProviderConfig(releaseConfig),
    secrets,
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

  // Check that at least one primary chat model is selected
  if (!releaseConfig.model_assignments.primary_chat_models ||
      releaseConfig.model_assignments.primary_chat_models.length === 0) {
    errors.push('At least one primary chat model must be selected')
  }

  // Check RAG + embedding model dependency
  if (releaseConfig.service_selections.rag_provider) {
    if (!releaseConfig.model_assignments.embedding_models ||
        releaseConfig.model_assignments.embedding_models.length === 0) {
      warnings.push('RAG is enabled but no embedding models selected. RAG may not work correctly.')
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
