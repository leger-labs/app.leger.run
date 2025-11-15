/**
 * Default Provider Configurations
 *
 * Provides sensible default values for infrastructure and service settings.
 *
 * IMPORTANT: This file contains ONLY infrastructure-level defaults:
 * - RAG settings (chunk size, overlap, top_k)
 * - Timeouts and performance settings
 * - Log levels
 * - Service-specific URLs (auto-generated from infrastructure)
 *
 * This file does NOT contain:
 * - Model selections (user chooses via UI)
 * - Provider API choices (user chooses via UI)
 *
 * The WebUI should pre-populate forms with these values, but users must
 * explicitly save their configuration. No values are injected at deployment time.
 */

export interface ProviderConfig {
  // ═══════════════════════════════════════════════════════════════════════════
  // OPENWEBUI CORE SETTINGS
  // ═══════════════════════════════════════════════════════════════════════════

  // Branding
  webui_name: string
  default_locale: string

  // Logging
  log_level: 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR'

  // Redis
  redis_key_prefix: string

  // Timeouts
  openwebui_timeout_start: number

  // ═══════════════════════════════════════════════════════════════════════════
  // RAG SETTINGS (Infrastructure Configuration, NOT Model Selection)
  // ═══════════════════════════════════════════════════════════════════════════

  // Retrieval settings
  rag_top_k: number
  chunk_size: number
  chunk_overlap: number
  pdf_extract_images: boolean

  // Security settings
  rag_embedding_trust_remote_code: boolean
  rag_reranking_trust_remote_code: boolean
  rag_embedding_auto_update: boolean
  rag_reranking_auto_update: boolean

  // ═══════════════════════════════════════════════════════════════════════════
  // AUDIO SETTINGS (Infrastructure, NOT Model Selection)
  // ═══════════════════════════════════════════════════════════════════════════

  // Default voice for TTS (infrastructure setting)
  audio_tts_voice: string

  // ═══════════════════════════════════════════════════════════════════════════
  // PROVIDER-SPECIFIC CONFIGS (Service Infrastructure)
  // ═══════════════════════════════════════════════════════════════════════════

  // Chroma (embedded vector DB)
  chroma_tenant: string
  chroma_database: string

  // Qdrant (dedicated vector DB)
  qdrant_grpc_port: number
  qdrant_prefer_grpc: boolean
  qdrant_on_disk: boolean

  // Autocomplete
  autocomplete_input_max_length: number

  // Other configs (extensible)
  [key: string]: unknown
}

/**
 * Default provider configuration values
 *
 * These are INFRASTRUCTURE settings only - no model selections.
 * The WebUI should use these to pre-populate forms, but users must
 * explicitly save their configuration.
 */
export const DEFAULT_PROVIDER_CONFIGS: ProviderConfig = {
  // ═══════════════════════════════════════════════════════════════════════════
  // OPENWEBUI CORE SETTINGS
  // ═══════════════════════════════════════════════════════════════════════════

  // Branding
  webui_name: 'Leger AI',
  default_locale: 'en-US',

  // Logging
  log_level: 'INFO',

  // Redis
  redis_key_prefix: 'open-webui',

  // Timeouts (15 minutes for first-time model downloads)
  openwebui_timeout_start: 900,

  // ═══════════════════════════════════════════════════════════════════════════
  // RAG SETTINGS
  // ═══════════════════════════════════════════════════════════════════════════

  // Retrieval settings (OpenWebUI defaults)
  rag_top_k: 5,
  chunk_size: 1500,
  chunk_overlap: 100,
  pdf_extract_images: true,

  // Security settings (conservative defaults)
  rag_embedding_trust_remote_code: false,
  rag_reranking_trust_remote_code: false,
  rag_embedding_auto_update: false,
  rag_reranking_auto_update: false,

  // ═══════════════════════════════════════════════════════════════════════════
  // AUDIO SETTINGS
  // ═══════════════════════════════════════════════════════════════════════════

  // Text-to-speech voice (OpenAI-compatible default)
  audio_tts_voice: 'alloy',

  // ═══════════════════════════════════════════════════════════════════════════
  // AUTOCOMPLETE
  // ═══════════════════════════════════════════════════════════════════════════

  autocomplete_input_max_length: 200,

  // ═══════════════════════════════════════════════════════════════════════════
  // PROVIDER-SPECIFIC CONFIGS
  // ═══════════════════════════════════════════════════════════════════════════

  // Chroma (embedded vector DB)
  chroma_tenant: 'default_tenant',
  chroma_database: 'default_database',

  // Qdrant (dedicated vector DB)
  qdrant_grpc_port: 6334,
  qdrant_prefer_grpc: false,
  qdrant_on_disk: true,
}

/**
 * Alternative configurations for different use cases
 * These can be used by the UI to offer preset configurations
 */
export const ALTERNATIVE_CONFIGS = {
  // Performance-optimized (faster, less accurate)
  performance: {
    rag_top_k: 3,
    chunk_size: 1000,
    chunk_overlap: 50,
  },

  // Quality-optimized (slower, more accurate)
  quality: {
    rag_top_k: 10,
    chunk_size: 2000,
    chunk_overlap: 200,
  },
}

/**
 * Get provider config with overrides
 */
export function getProviderConfig(overrides: Partial<ProviderConfig> = {}): ProviderConfig {
  return {
    ...DEFAULT_PROVIDER_CONFIGS,
    ...overrides,
  }
}

/**
 * Validate provider config (basic checks)
 */
export function validateProviderConfig(config: ProviderConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  // Check required fields
  if (!config.webui_name || config.webui_name.trim().length === 0) {
    errors.push('webui_name is required')
  }

  // Check numeric ranges
  if (config.rag_top_k < 1 || config.rag_top_k > 100) {
    errors.push('rag_top_k must be between 1 and 100')
  }

  if (config.chunk_size < 100 || config.chunk_size > 10000) {
    errors.push('chunk_size must be between 100 and 10000')
  }

  if (config.chunk_overlap < 0 || config.chunk_overlap >= config.chunk_size) {
    errors.push('chunk_overlap must be between 0 and chunk_size')
  }

  // Check log level
  const validLogLevels = ['DEBUG', 'INFO', 'WARNING', 'ERROR']
  if (!validLogLevels.includes(config.log_level)) {
    errors.push(`log_level must be one of: ${validLogLevels.join(', ')}`)
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}
