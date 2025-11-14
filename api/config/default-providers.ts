/**
 * Default Provider Selections
 *
 * Provides intelligent defaults for novice users with minimal resource requirements.
 *
 * Strategy:
 * - Use existing infrastructure where possible (pgvector uses openwebui-postgres)
 * - Deploy lightweight services by default (searxng, whisper, edgetts, jupyter)
 * - Disable resource-intensive services (comfyui, qdrant) unless explicitly requested
 * - Prefer local/self-hosted over cloud APIs for privacy and cost
 */

export interface ProviderDefaults {
  // Vector database for RAG
  vector_db: string | null

  // RAG components
  rag_embedding: string | null
  content_extraction: string | null
  text_splitter: string

  // Web search
  web_search_engine: string | null
  web_loader: string

  // Image generation
  image_engine: string | null

  // Audio
  stt_engine: string | null
  tts_engine: string | null

  // Code execution
  code_execution_engine: string | null

  // Storage
  storage_provider: string

  // Authentication
  auth_provider: string
}

/**
 * Default provider selections for novice users
 *
 * These are optimized for:
 * - Minimal resource usage
 * - Maximum functionality
 * - Privacy (local-first)
 * - Cost (free/self-hosted)
 */
export const DEFAULT_PROVIDERS: ProviderDefaults = {
  // ═══════════════════════════════════════════════════════════════════════════
  // RAG (Retrieval-Augmented Generation)
  // ═══════════════════════════════════════════════════════════════════════════

  // Use pgvector (PostgreSQL extension) - already have openwebui-postgres
  vector_db: 'pgvector',

  // Use OpenAI-compatible endpoint (points to llama-swap for local embeddings)
  rag_embedding: 'openai',

  // Use Apache Tika for content extraction (lightweight, comprehensive)
  content_extraction: 'tika',

  // Use recursive text splitter (better for varied content)
  text_splitter: 'recursive',

  // ═══════════════════════════════════════════════════════════════════════════
  // WEB SEARCH
  // ═══════════════════════════════════════════════════════════════════════════

  // Use SearXNG (privacy-respecting metasearch engine)
  web_search_engine: 'searxng',

  // Use requests-based loader (lightweight, no browser needed)
  web_loader: 'requests',

  // ═══════════════════════════════════════════════════════════════════════════
  // IMAGE GENERATION
  // ═══════════════════════════════════════════════════════════════════════════

  // Disabled by default (resource intensive)
  // Users can enable ComfyUI or use cloud APIs (OpenAI DALL-E, etc.)
  image_engine: null,

  // ═══════════════════════════════════════════════════════════════════════════
  // AUDIO (Speech-to-Text, Text-to-Speech)
  // ═══════════════════════════════════════════════════════════════════════════

  // Use Whisper for STT (OpenAI-compatible API)
  stt_engine: 'openai',

  // Use EdgeTTS for TTS (free, Microsoft Edge voices)
  tts_engine: 'openai',

  // ═══════════════════════════════════════════════════════════════════════════
  // CODE EXECUTION
  // ═══════════════════════════════════════════════════════════════════════════

  // Use Jupyter (full Python environment with AI assistance)
  code_execution_engine: 'jupyter',

  // ═══════════════════════════════════════════════════════════════════════════
  // STORAGE
  // ═══════════════════════════════════════════════════════════════════════════

  // Use local storage (no cloud dependencies)
  storage_provider: 'local',

  // ═══════════════════════════════════════════════════════════════════════════
  // AUTHENTICATION
  // ═══════════════════════════════════════════════════════════════════════════

  // Use local authentication (Tailscale provides network security)
  auth_provider: 'local',
}

/**
 * Alternative provider options (for advanced users)
 */
export const ALTERNATIVE_PROVIDERS = {
  vector_db: [
    'pgvector',   // ✅ Default - uses existing postgres
    'chroma',     // Embedded - no extra service
    'qdrant',     // Dedicated vector DB - best performance
    'milvus',     // Enterprise-grade
    'opensearch', // Full-text + vector
  ],

  rag_embedding: [
    'openai',     // ✅ Default - points to llama-swap
    'ollama',     // Native Ollama daemon
    '',           // Local (sentence-transformers)
  ],

  content_extraction: [
    'tika',       // ✅ Default - comprehensive, stable
    'docling',    // Advanced OCR, document intelligence
    'mistral_ocr', // Cloud-based OCR (requires API key)
  ],

  web_search_engine: [
    'searxng',    // ✅ Default - privacy-focused metasearch
    'tavily',     // Cloud API (requires key)
    'brave',      // Cloud API (requires key)
    'duckduckgo', // Free, no API key
    'google_pse', // Cloud API (requires key)
  ],

  stt_engine: [
    'openai',     // ✅ Default - points to whisper container
    'azure',      // Cloud (requires key)
    'deepgram',   // Cloud (requires key)
  ],

  tts_engine: [
    'openai',     // ✅ Default - points to edgetts container
    'azure',      // Cloud (requires key)
    'elevenlabs', // Cloud (requires key)
    'transformers', // Local (slower)
  ],

  code_execution_engine: [
    'jupyter',    // ✅ Default - full Python environment
    'pyodide',    // Browser-based (limited functionality)
  ],

  image_engine: [
    null,         // ✅ Default - disabled
    'openai',     // Cloud API (DALL-E)
    'comfyui',    // Local Stable Diffusion (GPU recommended)
    'automatic1111', // Local Stable Diffusion (alternative)
  ],
}

/**
 * Get service dependencies for a provider selection
 * Returns list of service names that must be deployed
 */
export function getProviderDependencies(
  providerType: keyof ProviderDefaults,
  providerValue: string | null
): string[] {
  const dependencies: string[] = []

  switch (providerType) {
    case 'vector_db':
      if (providerValue === 'qdrant') {
        dependencies.push('qdrant')
      }
      // pgvector and chroma don't need extra services
      break

    case 'content_extraction':
      if (providerValue === 'tika') {
        dependencies.push('tika')
      } else if (providerValue === 'docling') {
        dependencies.push('docling')
      }
      break

    case 'web_search_engine':
      if (providerValue === 'searxng') {
        dependencies.push('searxng', 'searxng-redis')
      }
      break

    case 'stt_engine':
      if (providerValue === 'openai') {
        dependencies.push('whisper')
      }
      break

    case 'tts_engine':
      if (providerValue === 'openai') {
        dependencies.push('edgetts')
      }
      break

    case 'code_execution_engine':
      if (providerValue === 'jupyter') {
        dependencies.push('jupyter')
      }
      break

    case 'image_engine':
      if (providerValue === 'comfyui') {
        dependencies.push('comfyui')
      } else if (providerValue === 'automatic1111') {
        dependencies.push('automatic1111')
      }
      break
  }

  return dependencies
}

/**
 * Get all service dependencies for a provider configuration
 */
export function getAllProviderDependencies(providers: Partial<ProviderDefaults>): string[] {
  const allDependencies = new Set<string>()

  for (const [type, value] of Object.entries(providers)) {
    const deps = getProviderDependencies(type as keyof ProviderDefaults, value as string | null)
    deps.forEach(dep => allDependencies.add(dep))
  }

  return Array.from(allDependencies)
}
