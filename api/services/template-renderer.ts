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
 * Fetch templates from GitHub (for now, we'll use a simple approach)
 * In production, these should be bundled or cached
 */
async function fetchTemplatesFromGitHub(
  version: string = 'v0.0.1'
): Promise<Map<string, string>> {
  const templates = new Map<string, string>()

  // For now, return empty map - this will be implemented to fetch from GitHub or bundle
  // In the meantime, we'll rely on pre-rendering or client-side rendering

  console.warn('Template fetching not yet implemented')
  return templates
}

/**
 * Render templates with user configuration
 *
 * NOTE: This is a simplified implementation for v0.2.0
 * Full implementation will require either:
 * 1. Bundling templates at build time
 * 2. Fetching templates from GitHub/R2
 * 3. Using a separate rendering service
 *
 * For now, we'll return a placeholder that indicates rendering is pending
 */
export async function renderTemplates(
  userConfig: UserConfig,
  schemaVersion: string = 'v0.0.1'
): Promise<RenderedFile[]> {
  // Load release catalog (stub for now)
  const releaseCatalog = {
    services: {},
    release: { version: schemaVersion },
  }

  // Build context
  const context = buildTemplateContext(userConfig, releaseCatalog)

  // Fetch templates (not implemented yet)
  const templates = await fetchTemplatesFromGitHub(schemaVersion)

  if (templates.size === 0) {
    // Return placeholder indicating templates need to be rendered
    // In practice, this should be handled by a separate rendering pipeline
    throw new Error(
      'Template rendering not fully implemented. ' +
      'Templates should be pre-rendered or rendered via separate service.'
    )
  }

  // Render each template
  const renderedFiles: RenderedFile[] = []

  // TODO: Implement actual rendering with Nunjucks
  // This requires either bundling Nunjucks or using a separate service

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
