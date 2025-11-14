/**
 * Default Model Catalog
 *
 * Provides intelligent defaults for novice users while allowing advanced customization.
 *
 * Strategy:
 * - Local models are enabled by default (no API keys needed)
 * - Cloud models are available but disabled by default (require API keys)
 * - Embedding models use local inference for privacy and cost efficiency
 */

export interface ModelDefinition {
  id: string
  displayName: string
  provider: string
  enabled: boolean
  requiresApiKey?: boolean
  description?: string
}

/**
 * Default local models (via llama-swap + ramalama)
 * These are enabled by default and require no API keys
 */
export const DEFAULT_LOCAL_MODELS: ModelDefinition[] = [
  {
    id: 'gpt-oss-20b',
    displayName: 'GPT-OSS 20B (Local)',
    provider: 'local',
    enabled: true,
    requiresApiKey: false,
    description: 'Fast general-purpose model (20B params, Q4_K_M quantization)',
  },
  {
    id: 'gpt-oss-120b',
    displayName: 'GPT-OSS 120B (Local)',
    provider: 'local',
    enabled: true,
    requiresApiKey: false,
    description: 'Powerful reasoning model (120B params, Q4_K_M quantization)',
  },
]

/**
 * Default embedding models (local, privacy-preserving)
 */
export const DEFAULT_EMBEDDING_MODELS: ModelDefinition[] = [
  {
    id: 'qwen3-embedding-8b',
    displayName: 'Qwen3 Embedding 8B',
    provider: 'local',
    enabled: true,
    requiresApiKey: false,
    description: 'High-quality embedding model (8B params, Q8_0 quantization)',
  },
]

/**
 * Default task models (tiny, ultra-fast)
 * Used for title generation, tags, autocomplete, etc.
 */
export const DEFAULT_TASK_MODELS: ModelDefinition[] = [
  {
    id: 'qwen3-0.6b',
    displayName: 'Qwen3 0.6B (Task)',
    provider: 'local',
    enabled: true,
    requiresApiKey: false,
    description: 'Ultra-fast task model for titles, autocomplete (0.6B params)',
  },
  {
    id: 'qwen3-4b',
    displayName: 'Qwen3 4B (Task)',
    provider: 'local',
    enabled: true,
    requiresApiKey: false,
    description: 'Balanced task model for tags, queries, analysis (4B params)',
  },
]

/**
 * Available cloud models (disabled by default, require API keys)
 * Users can enable these by providing API keys in Secrets
 */
export const AVAILABLE_CLOUD_MODELS: ModelDefinition[] = [
  // OpenAI GPT-5 Family
  {
    id: 'openai/gpt-5',
    displayName: 'GPT-5 (OpenAI)',
    provider: 'openai',
    enabled: false,
    requiresApiKey: true,
    description: 'OpenAI flagship model - 400K context, advanced reasoning',
  },
  {
    id: 'openai/gpt-5-mini',
    displayName: 'GPT-5 Mini (OpenAI)',
    provider: 'openai',
    enabled: false,
    requiresApiKey: true,
    description: 'Cost-efficient GPT-5 - 400K context, 80% cost reduction',
  },
  {
    id: 'openai/gpt-5-nano',
    displayName: 'GPT-5 Nano (OpenAI)',
    provider: 'openai',
    enabled: false,
    requiresApiKey: true,
    description: 'Ultra-fast GPT-5 - 400K context, 96% cost reduction',
  },

  // Anthropic Claude 4.x Family
  {
    id: 'anthropic/claude-sonnet-4-5',
    displayName: 'Claude Sonnet 4.5 (Anthropic)',
    provider: 'anthropic',
    enabled: false,
    requiresApiKey: true,
    description: 'Hybrid reasoning, 30+ hour autonomy, 200K context',
  },
  {
    id: 'anthropic/claude-opus-4-1',
    displayName: 'Claude Opus 4.1 (Anthropic)',
    provider: 'anthropic',
    enabled: false,
    requiresApiKey: true,
    description: 'Most powerful Opus - 7-hour memory, extended thinking',
  },

  // Google Gemini 2.5 Family
  {
    id: 'gemini/gemini-2.5-flash',
    displayName: 'Gemini 2.5 Flash (Google)',
    provider: 'gemini',
    enabled: false,
    requiresApiKey: true,
    description: 'Fast multimodal - 1M+ token context, reasoning control',
  },
  {
    id: 'gemini/gemini-2.5-pro',
    displayName: 'Gemini 2.5 Pro (Google)',
    provider: 'gemini',
    enabled: false,
    requiresApiKey: true,
    description: 'Most powerful Gemini - 2M token context, thinking budget',
  },
]

/**
 * Get default primary chat models (local only for novice users)
 */
export function getDefaultPrimaryChatModels(): string[] {
  return DEFAULT_LOCAL_MODELS
    .filter(m => m.enabled)
    .map(m => m.id)
}

/**
 * Get default embedding models
 */
export function getDefaultEmbeddingModels(): string[] {
  return DEFAULT_EMBEDDING_MODELS
    .filter(m => m.enabled)
    .map(m => m.id)
}

/**
 * Get all available models (for UI selection)
 */
export function getAllAvailableModels(): ModelDefinition[] {
  return [
    ...DEFAULT_LOCAL_MODELS,
    ...AVAILABLE_CLOUD_MODELS,
  ]
}

/**
 * Get model definition by ID
 */
export function getModelById(modelId: string): ModelDefinition | undefined {
  return getAllAvailableModels().find(m => m.id === modelId)
}

/**
 * Check if a model requires an API key
 */
export function modelRequiresApiKey(modelId: string): boolean {
  const model = getModelById(modelId)
  return model?.requiresApiKey ?? false
}

/**
 * Extract provider from model ID
 * Model IDs follow pattern: "provider/model-name" or "model-name" (local)
 */
export function extractProvider(modelId: string): string {
  const parts = modelId.split('/')
  return parts.length > 1 ? parts[0] : 'local'
}

/**
 * Get API key environment variable name for provider
 */
export function getApiKeyForProvider(provider: string): string {
  const keyMap: Record<string, string> = {
    'openai': 'OPENAI_API_KEY',
    'anthropic': 'ANTHROPIC_API_KEY',
    'gemini': 'GEMINI_API_KEY',
    'groq': 'GROQ_API_KEY',
    'mistral': 'MISTRAL_API_KEY',
    'openrouter': 'OPENROUTER_API_KEY',
    'perplexity': 'PERPLEXITY_API_KEY',
    'cohere': 'COHERE_API_KEY',
    'deepseek': 'DEEPSEEK_API_KEY',
  }
  return keyMap[provider] || `${provider.toUpperCase()}_API_KEY`
}
