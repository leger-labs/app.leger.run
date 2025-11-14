/**
 * Default Provider Configurations
 *
 * Provides sensible default values for all provider-specific settings.
 * These are the actual configuration values used by services (env vars, URLs, etc.)
 *
 * Organized by:
 * 1. OpenWebUI Core Settings
 * 2. RAG Settings
 * 3. Task Model Assignments
 * 4. Provider-Specific Configs
 */

export interface ProviderConfig {
  // ═══════════════════════════════════════════════════════════════════════════
  // OPENWEBUI CORE SETTINGS
  // ═══════════════════════════════════════════════════════════════════════════

  // Branding
  webui_name: string
  custom_name: string
  default_locale: string

  // Logging
  log_level: 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR'

  // Redis
  redis_key_prefix: string

  // Timeouts
  openwebui_timeout_start: number

  // ═══════════════════════════════════════════════════════════════════════════
  // RAG SETTINGS
  // ═══════════════════════════════════════════════════════════════════════════

  // Retrieval settings
  rag_top_k: number
  chunk_size: number
  chunk_overlap: number
  pdf_extract_images: boolean

  // Embedding model (resolved from model-store)
  rag_embedding_model: string

  // Security settings
  rag_embedding_trust_remote_code: boolean
  rag_reranking_trust_remote_code: boolean
  rag_embedding_auto_update: boolean
  rag_reranking_auto_update: boolean

  // ═══════════════════════════════════════════════════════════════════════════
  // TASK MODEL ASSIGNMENTS (Small, Fast Models for UI Operations)
  // ═══════════════════════════════════════════════════════════════════════════

  task_model_title: string
  task_model_tags: string
  task_model_autocomplete: string
  task_model_query: string
  task_model_search_query: string
  task_model_rag_template: string

  // Task model settings
  autocomplete_input_max_length: number

  // ═══════════════════════════════════════════════════════════════════════════
  // AUDIO SETTINGS
  // ═══════════════════════════════════════════════════════════════════════════

  audio_stt_model: string
  audio_tts_model: string
  audio_tts_voice: string

  // ═══════════════════════════════════════════════════════════════════════════
  // PROVIDER-SPECIFIC CONFIGS
  // ═══════════════════════════════════════════════════════════════════════════

  // Chroma (embedded vector DB)
  chroma_tenant: string
  chroma_database: string

  // Qdrant (dedicated vector DB)
  qdrant_grpc_port: number
  qdrant_prefer_grpc: boolean
  qdrant_on_disk: boolean

  // Other configs (extensible)
  [key: string]: unknown
}

/**
 * Default provider configuration values
 *
 * These are optimized for novice users with sensible defaults based on:
 * - OpenWebUI best practices
 * - Community recommendations
 * - Performance testing
 * - Resource constraints
 */
export const DEFAULT_PROVIDER_CONFIGS: ProviderConfig = {
  // ═══════════════════════════════════════════════════════════════════════════
  // OPENWEBUI CORE SETTINGS
  // ═══════════════════════════════════════════════════════════════════════════

  // Branding
  webui_name: 'Leger AI',
  custom_name: '',
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

  // Embedding model (local, privacy-preserving)
  rag_embedding_model: 'qwen3-embedding-8b',

  // Security settings (conservative defaults)
  rag_embedding_trust_remote_code: false,
  rag_reranking_trust_remote_code: false,
  rag_embedding_auto_update: false,
  rag_reranking_auto_update: false,

  // ═══════════════════════════════════════════════════════════════════════════
  // TASK MODEL ASSIGNMENTS
  // ═══════════════════════════════════════════════════════════════════════════

  // Ultra-fast models (0.6B) for single-task operations
  task_model_title: 'qwen3-0.6b',
  task_model_autocomplete: 'qwen3-0.6b',

  // Balanced models (4B) for multi-step operations
  task_model_tags: 'qwen3-4b',
  task_model_query: 'qwen3-4b',
  task_model_search_query: 'qwen3-4b',
  task_model_rag_template: 'qwen3-4b',

  // Task model settings
  autocomplete_input_max_length: 200,

  // ═══════════════════════════════════════════════════════════════════════════
  // AUDIO SETTINGS
  // ═══════════════════════════════════════════════════════════════════════════

  // Speech-to-text (OpenAI-compatible, points to whisper container)
  audio_stt_model: 'whisper-1',

  // Text-to-speech (OpenAI-compatible, points to edgetts container)
  audio_tts_model: 'tts-1',
  audio_tts_voice: 'alloy',  // Default OpenAI voice

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

  // Resource-constrained (minimal memory)
  minimal: {
    task_model_title: 'qwen3-0.6b',
    task_model_tags: 'qwen3-0.6b',
    task_model_autocomplete: 'qwen3-0.6b',
    task_model_query: 'qwen3-0.6b',
    task_model_search_query: 'qwen3-0.6b',
    task_model_rag_template: 'qwen3-0.6b',
  },

  // Power-user (best quality, more resources)
  power: {
    task_model_title: 'qwen3-4b',
    task_model_tags: 'qwen3-8b',
    task_model_autocomplete: 'qwen3-4b',
    task_model_query: 'qwen3-8b',
    task_model_search_query: 'qwen3-8b',
    task_model_rag_template: 'qwen3-8b',
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
