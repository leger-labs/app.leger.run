/**
 * Template rendering service
 * Renders Nunjucks templates with user configuration
 *
 * This is a simplified version adapted for Cloudflare Workers.
 * Templates are fetched from the schemas submodule.
 */

import type { UserConfig } from '../models/configuration'

/**
 * Rendered file output
 */
export interface RenderedFile {
  name: string // Output filename (e.g., "services.openwebui.openwebui.container")
  content: string // Rendered content
  type: 'container' | 'volume' | 'network' | 'config' | 'env' // File type
}

/**
 * Template rendering context
 */
interface TemplateContext {
  infrastructure: UserConfig['infrastructure']
  features: UserConfig['features']
  providers: UserConfig['providers']
  provider_config: UserConfig['provider_config']
  tailscale: UserConfig['tailscale']
  litellm: unknown
  local_inference: unknown
  openwebui: unknown
  qdrant: unknown
  searxng: unknown
  jupyter: unknown
  mcp_context_forge: unknown
  catalog: unknown
}

/**
 * Extract provider name from model ID
 * Model IDs follow pattern: "provider/model-name" (e.g., "openai/gpt-4", "anthropic/claude-3")
 */
function extractProvider(modelId: string): string {
  const parts = modelId.split('/')
  return parts.length > 1 ? parts[0] : 'unknown'
}

/**
 * Get API key name for provider
 * Converts provider name to the corresponding environment variable name
 */
function getApiKeyForProvider(provider: string): string {
  // Map provider names to their API key environment variable names
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
    'aws-bedrock': 'AWS_BEDROCK_API_KEY',
    'azure': 'AZURE_API_KEY',
    'vertex-ai': 'VERTEX_AI_API_KEY',
  }
  return keyMap[provider] || `${provider.toUpperCase()}_API_KEY`
}

/**
 * Build template context from user configuration
 */
function buildTemplateContext(userConfig: UserConfig, releaseCatalog: unknown): TemplateContext {
  // Build cloud models array from userConfig.models.cloud
  const cloudModels = (userConfig.models?.cloud || []).map(modelId => {
    const provider = extractProvider(modelId)
    const apiKey = getApiKeyForProvider(provider)

    return {
      name: modelId.split('/').pop() || modelId, // Extract model name
      litellm_model_name: modelId, // Full ID for LiteLLM
      requires_api_key: apiKey,
      provider: provider,
    }
  })

  // Build local models from userConfig.models.local
  const localModels: Record<string, any> = {}
  ;(userConfig.models?.local || []).forEach(modelId => {
    localModels[modelId] = {
      name: modelId,
      display_name: modelId,
      enabled: true,
      group: modelId.includes('embed') ? 'embeddings' : 'chat',
    }
  })

  return {
    infrastructure: userConfig.infrastructure || {},
    features: userConfig.features || {},
    providers: userConfig.providers || {},
    provider_config: userConfig.provider_config || {},
    tailscale: userConfig.tailscale || {
      full_hostname: 'blueprint.tail8dd1.ts.net',
      hostname: 'blueprint',
      tailnet: 'tail8dd1.ts.net',
    },

    // Build litellm context with populated models
    litellm: {
      models: cloudModels,
      database_url: userConfig.litellm?.database_url ||
                    'postgresql://litellm@litellm-postgres:5432/litellm',
      drop_params: userConfig.litellm?.drop_params !== false,
    },

    // Build local_inference context with populated models
    local_inference: {
      models: localModels,
      groups: userConfig.local_inference?.groups || {},
      defaults: userConfig.local_inference?.defaults || {},
    },

    // Service-specific contexts
    openwebui: {
      providers: userConfig.providers || {},
      features: userConfig.features || {},
      service: {
        timeout_start_sec: userConfig.provider_config?.openwebui_timeout_start || 900,
      },
    },
    qdrant: {
      providers: userConfig.providers || {},
      features: userConfig.features || {},
    },
    searxng: {
      providers: userConfig.providers || {},
      features: userConfig.features || {},
    },
    jupyter: {
      providers: userConfig.providers || {},
      features: userConfig.features || {},
    },
    mcp_context_forge: {
      providers: userConfig.providers || {},
      features: userConfig.features || {},
      jwt_algorithm: 'HS256',
      environment: 'production',
      log_level: 'INFO',
    },

    // Release catalog
    catalog: releaseCatalog,
  }
}

/**
 * Get file type from filename
 */
function getFileType(filename: string): RenderedFile['type'] {
  if (filename.endsWith('.container')) return 'container'
  if (filename.endsWith('.volume')) return 'volume'
  if (filename.endsWith('.network')) return 'network'
  if (filename.endsWith('.env')) return 'env'
  return 'config'
}

/**
 * Quadlet metadata extracted from rendered files
 */
export interface QuadletMetadata {
  image?: string
  ports?: string[]
  secrets?: string[]
  volumes?: string[]
  environment?: Record<string, string>
}

/**
 * Enhanced rendered file with metadata
 */
export interface RenderedFileWithMetadata extends RenderedFile {
  checksum: string
  metadata: QuadletMetadata
}

/**
 * Generate a container quadlet file
 */
function generateContainerQuadlet(
  serviceName: string,
  image: string,
  options: {
    description?: string
    ports?: string[]
    environment?: Record<string, string>
    secrets?: string[]
    volumes?: string[]
    network?: string
    dependencies?: string[]
    containerName?: string
    pullPolicy?: string
    healthCmd?: string
  } = {}
): string {
  const lines: string[] = []

  // [Unit] section
  lines.push('[Unit]')
  lines.push(`Description=${options.description || serviceName + ' container'}`)
  lines.push('Documentation=https://docs.leger.run/')
  lines.push('')

  // Dependencies
  lines.push('# Dependencies')
  lines.push('After=network-online.target')

  if (options.network) {
    lines.push(`After=${options.network}.network.service`)
    lines.push(`Requires=${options.network}.network.service`)
  }

  if (options.dependencies && options.dependencies.length > 0) {
    options.dependencies.forEach(dep => {
      lines.push(`After=${dep}.service`)
      lines.push(`Wants=${dep}.service`)
    })
  }

  lines.push('Wants=network-online.target')
  lines.push('')

  // [Container] section
  lines.push('[Container]')
  lines.push(`Image=${image}`)
  lines.push(`AutoUpdate=${options.pullPolicy || 'registry'}`)

  if (options.containerName) {
    lines.push(`ContainerName=${options.containerName}`)
  }

  // Add network
  if (options.network) {
    lines.push(`Network=${options.network}.network`)
  }

  lines.push('')

  // Add ports
  if (options.ports && options.ports.length > 0) {
    lines.push('# Published ports')
    options.ports.forEach(port => {
      lines.push(`PublishPort=${port}`)
    })
    lines.push('')
  }

  // Add environment variables
  if (options.environment && Object.keys(options.environment).length > 0) {
    lines.push('# Environment variables')
    Object.entries(options.environment).forEach(([key, value]) => {
      lines.push(`Environment=${key}=${value}`)
    })
    lines.push('')
  }

  // Add secrets
  if (options.secrets && options.secrets.length > 0) {
    lines.push('# Secrets')
    options.secrets.forEach(secret => {
      lines.push(`Secret=${secret}`)
    })
    lines.push('')
  }

  // Add volumes
  if (options.volumes && options.volumes.length > 0) {
    lines.push('# Volumes')
    options.volumes.forEach(volume => {
      lines.push(`Volume=${volume}`)
    })
    lines.push('')
  }

  // Health check
  if (options.healthCmd) {
    lines.push('# Health check')
    lines.push(`HealthCmd=${options.healthCmd}`)
    lines.push('HealthInterval=30s')
    lines.push('HealthTimeout=10s')
    lines.push('HealthRetries=3')
    lines.push('HealthStartPeriod=60s')
    lines.push('')
  }

  // [Service] section
  lines.push('[Service]')
  lines.push('Slice=llm.slice')
  lines.push('Restart=always')
  lines.push('RestartSec=10')
  lines.push('TimeoutStartSec=900')
  lines.push('')

  // [Install] section
  lines.push('[Install]')
  lines.push('WantedBy=default.target')

  return lines.join('\n')
}

/**
 * Generate a network quadlet file
 */
function generateNetworkQuadlet(networkName: string, subnet?: string): string {
  const lines: string[] = []

  lines.push('[Unit]')
  lines.push(`Description=${networkName} network`)
  lines.push('')

  lines.push('[Network]')
  if (subnet) {
    lines.push(`Subnet=${subnet}`)
  }
  lines.push('')

  lines.push('[Install]')
  lines.push('WantedBy=default.target')

  return lines.join('\n')
}

/**
 * Generate a volume quadlet file
 */
function generateVolumeQuadlet(volumeName: string): string {
  const lines: string[] = []

  lines.push('[Unit]')
  lines.push(`Description=${volumeName} volume`)
  lines.push('')

  lines.push('[Volume]')
  lines.push('')

  lines.push('[Install]')
  lines.push('WantedBy=default.target')

  return lines.join('\n')
}

/**
 * Extract metadata from quadlet content
 */
export function extractQuadletMetadata(quadletContent: string, filename: string): QuadletMetadata {
  const metadata: QuadletMetadata = {
    ports: [],
    secrets: [],
    volumes: [],
    environment: {}
  }

  // Parse INI-style format
  const lines = quadletContent.split('\n')

  for (const line of lines) {
    const trimmed = line.trim()

    // Extract image
    if (trimmed.startsWith('Image=')) {
      metadata.image = trimmed.substring(6)
    }

    // Extract ports
    else if (trimmed.startsWith('PublishPort=')) {
      metadata.ports?.push(trimmed.substring(12))
    }

    // Extract secrets
    else if (trimmed.startsWith('Secret=')) {
      const secretDef = trimmed.substring(7)
      // Extract secret name (before comma if there are options)
      const secretName = secretDef.split(',')[0]
      metadata.secrets?.push(secretName)
    }

    // Extract volumes
    else if (trimmed.startsWith('Volume=')) {
      metadata.volumes?.push(trimmed.substring(7))
    }

    // Extract environment
    else if (trimmed.startsWith('Environment=')) {
      const envDef = trimmed.substring(12)
      const [key, value] = envDef.split('=', 2)
      if (metadata.environment) {
        metadata.environment[key] = value || ''
      }
    }
  }

  return metadata
}

/**
 * Service configuration mapping
 * Maps service names to their container images and configurations
 */
const SERVICE_IMAGES: Record<string, {
  image: string;
  ports?: string[];
  volumes?: string[];
  description?: string;
  dependencies?: string[];
}> = {
  'caddy': {
    image: 'docker.io/caddy:2-alpine',
    ports: ['80:80', '443:443', '443:443/udp'],
    volumes: ['caddy-config.volume:/config', 'caddy-data.volume:/data'],
    description: 'Caddy Reverse Proxy for LLM Services',
    dependencies: []
  },
  'cockpit': {
    image: 'quay.io/cockpit/ws:latest',
    ports: ['127.0.0.1:9090:9090'],
    volumes: [],
    description: 'Cockpit Web Console',
    dependencies: []
  },
  'openwebui': {
    image: 'ghcr.io/open-webui/open-webui:main',
    ports: ['127.0.0.1:3000:8080'],
    volumes: ['openwebui.volume:/app/backend/data'],
    description: 'Open WebUI - LLM Chat Interface',
    dependencies: ['openwebui-postgres', 'openwebui-redis', 'litellm']
  },
  'openwebui-postgres': {
    image: 'docker.io/postgres:16-alpine',
    ports: [],
    volumes: ['openwebui-postgres.volume:/var/lib/postgresql/data'],
    description: 'PostgreSQL for OpenWebUI',
    dependencies: []
  },
  'openwebui-redis': {
    image: 'docker.io/redis:7-alpine',
    ports: [],
    volumes: ['openwebui-redis.volume:/data'],
    description: 'Redis for OpenWebUI',
    dependencies: []
  },
  'litellm': {
    image: 'ghcr.io/berriai/litellm:main-latest',
    ports: ['127.0.0.1:4000:4000'],
    volumes: [],
    description: 'LiteLLM - Unified LLM Proxy',
    dependencies: ['litellm-postgres', 'litellm-redis']
  },
  'litellm-postgres': {
    image: 'docker.io/postgres:16-alpine',
    ports: [],
    volumes: ['litellm-postgres.volume:/var/lib/postgresql/data'],
    description: 'PostgreSQL for LiteLLM',
    dependencies: []
  },
  'litellm-redis': {
    image: 'docker.io/redis:7-alpine',
    ports: [],
    volumes: ['litellm-redis.volume:/data'],
    description: 'Redis for LiteLLM',
    dependencies: []
  },
  'llama-swap': {
    image: 'ghcr.io/mostlygeek/llama-swap:latest',
    ports: ['127.0.0.1:8000:8000'],
    volumes: ['llama-swap.volume:/models'],
    description: 'Llama-Swap - Local Model Router',
    dependencies: []
  },
  'qdrant': {
    image: 'docker.io/qdrant/qdrant:latest',
    ports: ['127.0.0.1:6333:6333', '127.0.0.1:6334:6334'],
    volumes: ['qdrant.volume:/qdrant/storage'],
    description: 'Qdrant Vector Database',
    dependencies: []
  },
  'searxng': {
    image: 'docker.io/searxng/searxng:latest',
    ports: ['127.0.0.1:8080:8080'],
    volumes: [],
    description: 'SearXNG - Privacy-respecting metasearch engine',
    dependencies: ['searxng-redis']
  },
  'searxng-redis': {
    image: 'docker.io/redis:7-alpine',
    ports: [],
    volumes: [],
    description: 'Redis for SearXNG',
    dependencies: []
  },
  'comfyui': {
    image: 'ghcr.io/ai-dock/comfyui:latest',
    ports: ['127.0.0.1:8188:8188'],
    volumes: ['comfyui.volume:/workspace', 'comfyui-models.volume:/models'],
    description: 'ComfyUI - Stable Diffusion GUI',
    dependencies: []
  },
  'whisper': {
    image: 'onerahmet/openai-whisper-asr-webservice:latest',
    ports: ['127.0.0.1:9000:9000'],
    volumes: [],
    description: 'Whisper ASR - Speech to Text',
    dependencies: []
  },
  'edgetts': {
    image: 'ghcr.io/travisvn/edge-tts-docker:latest',
    ports: ['127.0.0.1:5500:5500'],
    volumes: [],
    description: 'Edge TTS - Text to Speech',
    dependencies: []
  },
  'jupyter': {
    image: 'quay.io/jupyter/minimal-notebook:latest',
    ports: ['127.0.0.1:8888:8888'],
    volumes: ['jupyter.volume:/home/jovyan/work'],
    description: 'Jupyter Notebook - Code Execution',
    dependencies: []
  },
  'tika': {
    image: 'apache/tika:latest',
    ports: ['127.0.0.1:9998:9998'],
    volumes: [],
    description: 'Apache Tika - Content Extraction',
    dependencies: []
  }
}

/**
 * Render templates with user configuration
 *
 * Generates quadlet files from user configuration based on enabled features and providers
 */
export async function renderTemplates(
  userConfig: UserConfig,
  schemaVersion: string = 'v0.0.1'
): Promise<RenderedFile[]> {
  const renderedFiles: RenderedFile[] = []
  const networkName = userConfig.infrastructure?.network?.name || 'llm'
  const networkSubnet = userConfig.infrastructure?.network?.subnet

  // 1. Generate network quadlet
  const networkContent = generateNetworkQuadlet(networkName, networkSubnet)
  renderedFiles.push({
    name: `${networkName}.network`,
    content: networkContent,
    type: 'network'
  })

  // 2. Determine which services to deploy from infrastructure.services
  const servicesToDeploy = new Set<string>()

  // Get services from UserConfig infrastructure.services
  if (userConfig.infrastructure?.services) {
    // Add all services that are defined in the infrastructure
    for (const [serviceName, serviceConfig] of Object.entries(userConfig.infrastructure.services)) {
      // Skip if service is explicitly disabled
      if (serviceConfig && typeof serviceConfig === 'object' && 'enabled' in serviceConfig && !serviceConfig.enabled) {
        continue
      }
      servicesToDeploy.add(serviceName)
    }
  } else {
    // Fallback: Determine services from legacy features/providers
    // Core services - always include
    servicesToDeploy.add('caddy')
    servicesToDeploy.add('cockpit')
    servicesToDeploy.add('openwebui')
    servicesToDeploy.add('openwebui-postgres')
    servicesToDeploy.add('openwebui-redis')
    servicesToDeploy.add('litellm')
    servicesToDeploy.add('litellm-postgres')
    servicesToDeploy.add('litellm-redis')
    servicesToDeploy.add('llama-swap')

    // Feature-based services
    if (userConfig.features?.rag_enabled || userConfig.providers?.vector_db) {
      const vectorDb = userConfig.providers?.vector_db
      if (vectorDb === 'qdrant') {
        servicesToDeploy.add('qdrant')
      }
    }

    if (userConfig.features?.web_search_enabled || userConfig.providers?.web_search_engine) {
      const searchEngine = userConfig.providers?.web_search_engine
      if (searchEngine === 'searxng') {
        servicesToDeploy.add('searxng')
        servicesToDeploy.add('searxng-redis')
      }
    }

    if (userConfig.features?.image_generation_enabled || userConfig.providers?.image_engine) {
      const imageEngine = userConfig.providers?.image_engine
      if (imageEngine === 'comfyui') {
        servicesToDeploy.add('comfyui')
      }
    }

    if (userConfig.features?.stt_enabled || userConfig.providers?.stt_engine) {
      const sttEngine = userConfig.providers?.stt_engine
      if (sttEngine === 'whisper' || sttEngine === 'whisper-local') {
        servicesToDeploy.add('whisper')
      }
    }

    if (userConfig.features?.tts_enabled || userConfig.providers?.tts_engine) {
      const ttsEngine = userConfig.providers?.tts_engine
      if (ttsEngine === 'edgetts') {
        servicesToDeploy.add('edgetts')
      }
    }

    if (userConfig.features?.code_execution_enabled || userConfig.providers?.code_execution_engine) {
      const codeEngine = userConfig.providers?.code_execution_engine
      if (codeEngine === 'jupyter') {
        servicesToDeploy.add('jupyter')
      }
    }

    if (userConfig.providers?.content_extraction) {
      const extractionEngine = userConfig.providers.content_extraction
      if (extractionEngine === 'tika') {
        servicesToDeploy.add('tika')
      }
    }
  }

  // 3. Generate service quadlets
  for (const serviceName of servicesToDeploy) {
    const serviceConfig = SERVICE_IMAGES[serviceName]
    if (!serviceConfig) {
      console.warn(`Unknown service: ${serviceName}, skipping`)
      continue
    }

    // Build environment variables
    const environment: Record<string, string> = {}

    // Extract secrets for this service
    const secrets: string[] = []

    // Service-specific configurations
    if (serviceName === 'litellm') {
      environment['DATABASE_URL'] = 'postgresql://litellm@litellm-postgres:5432/litellm'
      environment['REDIS_HOST'] = 'litellm-redis'
      environment['REDIS_PORT'] = '6379'

      // Add API keys dynamically based on selected cloud models
      const usedProviders = new Set<string>()
      ;(userConfig.models?.cloud || []).forEach(modelId => {
        const provider = extractProvider(modelId)
        usedProviders.add(provider)
      })

      // Add secrets for each used provider
      usedProviders.forEach(provider => {
        const secretName = provider.toLowerCase().replace('-', '_') + '_api_key'
        secrets.push(secretName)
      })
    }

    if (serviceName === 'litellm-postgres') {
      environment['POSTGRES_USER'] = 'litellm'
      environment['POSTGRES_DB'] = 'litellm'
      secrets.push('postgres_password')
    }

    if (serviceName === 'openwebui') {
      environment['DATABASE_URL'] = 'postgresql://openwebui@openwebui-postgres:5432/openwebui'
      environment['REDIS_URL'] = 'redis://openwebui-redis:6379'
      environment['OPENAI_API_BASE_URL'] = 'http://litellm:4000/v1'

      // Add OpenWebUI config from provider_config
      if (userConfig.provider_config) {
        if (userConfig.provider_config.webui_name) {
          environment['WEBUI_NAME'] = userConfig.provider_config.webui_name
        }
        if (userConfig.provider_config.rag_top_k) {
          environment['RAG_TOP_K'] = String(userConfig.provider_config.rag_top_k)
        }
        if (userConfig.provider_config.chunk_size) {
          environment['CHUNK_SIZE'] = String(userConfig.provider_config.chunk_size)
        }
        if (userConfig.provider_config.chunk_overlap) {
          environment['CHUNK_OVERLAP'] = String(userConfig.provider_config.chunk_overlap)
        }
      }
    }

    if (serviceName === 'openwebui-postgres') {
      environment['POSTGRES_USER'] = 'openwebui'
      environment['POSTGRES_DB'] = 'openwebui'
      secrets.push('postgres_password')
    }

    if (serviceName === 'qdrant' && userConfig.provider_config?.qdrant_api_key) {
      secrets.push('qdrant_api_key')
    }

    // Generate container quadlet
    const quadletContent = generateContainerQuadlet(
      serviceName,
      serviceConfig.image,
      {
        description: serviceConfig.description,
        ports: serviceConfig.ports,
        volumes: serviceConfig.volumes,
        environment,
        secrets,
        network: networkName,
        dependencies: serviceConfig.dependencies,
        containerName: serviceName,
      }
    )

    renderedFiles.push({
      name: `${serviceName}.container`,
      content: quadletContent,
      type: 'container'
    })
  }

  // 4. Generate volume quadlets
  const volumesNeeded = new Set<string>()
  for (const serviceName of servicesToDeploy) {
    const serviceConfig = SERVICE_IMAGES[serviceName]
    if (serviceConfig?.volumes) {
      serviceConfig.volumes.forEach(vol => {
        // Extract volume name (before colon)
        const volumeName = vol.split(':')[0]
        volumesNeeded.add(volumeName)
      })
    }
  }

  for (const volumeName of volumesNeeded) {
    const volumeContent = generateVolumeQuadlet(volumeName)
    renderedFiles.push({
      name: `${volumeName}.volume`,
      content: volumeContent,
      type: 'volume'
    })
  }

  console.log(`✅ Rendered ${renderedFiles.length} files for ${servicesToDeploy.size} services`)

  return renderedFiles
}

/**
 * Calculate SHA-256 checksum for content
 */
export async function calculateChecksum(content: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(content)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Validate rendered files
 */
export function validateRenderedFiles(files: RenderedFile[]): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (files.length === 0) {
    errors.push('No files were rendered')
  }

  // Check for required network file
  const hasNetwork = files.some(f => f.type === 'network')
  if (!hasNetwork) {
    errors.push('Missing required network definition')
  }

  // Check that all files have content
  for (const file of files) {
    if (!file.content || file.content.trim().length === 0) {
      errors.push(`File '${file.name}' has no content`)
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}
