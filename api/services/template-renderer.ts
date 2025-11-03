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
 * Build template context from user configuration
 */
function buildTemplateContext(userConfig: UserConfig, releaseCatalog: unknown): TemplateContext {
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

    // Build litellm context
    litellm: {
      models: [], // Will be populated from resolved cloud models
      database_url: userConfig.litellm?.database_url ||
                    'postgresql://litellm@litellm-postgres:5432/litellm',
      drop_params: userConfig.litellm?.drop_params !== false,
    },

    // Build local_inference context
    local_inference: {
      models: {}, // Will be populated from resolved local models
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
    ports?: string[]
    environment?: Record<string, string>
    secrets?: string[]
    volumes?: string[]
    network?: string
  } = {}
): string {
  const lines: string[] = []

  // [Unit] section
  lines.push('[Unit]')
  lines.push(`Description=${serviceName} container`)
  lines.push('After=network-online.target')
  lines.push('Wants=network-online.target')
  lines.push('')

  // [Container] section
  lines.push('[Container]')
  lines.push(`Image=${image}`)

  // Add ports
  if (options.ports && options.ports.length > 0) {
    options.ports.forEach(port => {
      lines.push(`PublishPort=${port}`)
    })
  }

  // Add environment variables
  if (options.environment) {
    Object.entries(options.environment).forEach(([key, value]) => {
      lines.push(`Environment=${key}=${value}`)
    })
  }

  // Add secrets
  if (options.secrets && options.secrets.length > 0) {
    options.secrets.forEach(secret => {
      lines.push(`Secret=${secret}`)
    })
  }

  // Add volumes
  if (options.volumes && options.volumes.length > 0) {
    options.volumes.forEach(volume => {
      lines.push(`Volume=${volume}`)
    })
  }

  // Add network
  if (options.network) {
    lines.push(`Network=${options.network}`)
  }

  lines.push('')

  // [Service] section
  lines.push('[Service]')
  lines.push('Restart=always')
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
const SERVICE_IMAGES: Record<string, { image: string; ports?: string[]; volumes?: string[] }> = {
  'litellm': {
    image: 'ghcr.io/berriai/litellm:latest',
    ports: ['4000:4000'],
    volumes: []
  },
  'openwebui': {
    image: 'ghcr.io/open-webui/open-webui:latest',
    ports: ['8080:8080'],
    volumes: ['openwebui-data:/app/backend/data']
  },
  'qdrant': {
    image: 'qdrant/qdrant:latest',
    ports: ['6333:6333'],
    volumes: ['qdrant-data:/qdrant/storage']
  },
  'postgres': {
    image: 'postgres:15',
    ports: ['5432:5432'],
    volumes: ['postgres-data:/var/lib/postgresql/data']
  },
  'searxng': {
    image: 'searxng/searxng:latest',
    ports: ['8888:8080']
  },
  'jupyter': {
    image: 'jupyter/minimal-notebook:latest',
    ports: ['8888:8888']
  },
  'caddy': {
    image: 'caddy:latest',
    ports: ['443:443', '80:80'],
    volumes: ['caddy-data:/data', 'caddy-config:/config']
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

  // 2. Determine which services to deploy based on configuration
  const servicesToDeploy = new Set<string>()

  // Core services
  if (userConfig.providers?.llm_proxy === 'litellm') {
    servicesToDeploy.add('litellm')
    servicesToDeploy.add('postgres') // LiteLLM needs postgres
  }

  if (userConfig.providers?.web_ui === 'openwebui' || userConfig.features?.web_ui) {
    servicesToDeploy.add('openwebui')
  }

  // Feature-based services
  if (userConfig.features?.rag) {
    const vectorDb = userConfig.providers?.vector_db
    if (vectorDb === 'qdrant') {
      servicesToDeploy.add('qdrant')
    }
  }

  if (userConfig.features?.web_search) {
    servicesToDeploy.add('searxng')
  }

  if (userConfig.features?.jupyter) {
    servicesToDeploy.add('jupyter')
  }

  // Always add caddy for reverse proxy
  servicesToDeploy.add('caddy')

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
    if (serviceName === 'litellm' && userConfig.provider_config) {
      // Add API keys as secrets
      const config = userConfig.provider_config
      if (config.openai_api_key) secrets.push('openai_api_key')
      if (config.anthropic_api_key) secrets.push('anthropic_api_key')

      // Database URL
      if (userConfig.litellm?.database_url) {
        environment['DATABASE_URL'] = userConfig.litellm.database_url
      }
    }

    if (serviceName === 'postgres') {
      environment['POSTGRES_USER'] = 'litellm'
      environment['POSTGRES_DB'] = 'litellm'
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
        ports: serviceConfig.ports,
        volumes: serviceConfig.volumes,
        environment,
        secrets,
        network: networkName
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
