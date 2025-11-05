/**
 * Marketplace service data models
 * For managing installed marketplace services
 */

/**
 * Service variable definition
 */
export interface ServiceVariable {
  name: string
  type: 'str' | 'int' | 'float' | 'bool'
  default: string | number | boolean | null
  description: string | null
  options: string[]
}

/**
 * Service definition from marketplace
 */
export interface ServiceDefinition {
  id: string
  name: string
  category: string
  requires_api_key: boolean
  logo: string
  openwebui_variables: ServiceVariable[]
}

/**
 * Installed service configuration
 */
export interface InstalledService {
  serviceId: string
  enabled: boolean
  config: Record<string, any>
  installedAt: string
  updatedAt: string
}

/**
 * Service installation input
 */
export interface InstallServiceInput {
  serviceId: string
  config: Record<string, any>
}

/**
 * Service update input
 */
export interface UpdateServiceInput {
  enabled?: boolean
  config?: Record<string, any>
}

/**
 * Validate service configuration
 */
export function isValidServiceConfig(config: unknown): config is Record<string, any> {
  if (!config || typeof config !== 'object') {
    return false
  }
  return true
}

/**
 * List of available service categories
 */
export const SERVICE_CATEGORIES = [
  'llm',
  'rag',
  'image-generation',
  'speech-to-text',
  'text-to-speech',
  'web-search',
  'storage',
  'database',
  'cache',
  'code-execution',
  'document-integration',
  'content-extraction',
] as const

export type ServiceCategory = typeof SERVICE_CATEGORIES[number]
