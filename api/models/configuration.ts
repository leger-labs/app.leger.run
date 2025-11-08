/**
 * Configuration data models
 * For storing user configurations (schema.json format) in D1
 */

import type { ReleaseConfig } from './release-config'

/**
 * Configuration record stored in D1
 */
export interface ConfigurationRecord {
  id: string // UUID v4
  user_uuid: string // Owner
  release_id: string | null // Optional link to release
  config_data: string // JSON string of user configuration or release configuration
  schema_version: string // Schema version (e.g., "0.2.0", "1.0.0")
  version: number // Auto-increment per release
  created_at: string // ISO 8601 timestamp
}

/**
 * Parsed user configuration (schema.json format)
 */
export interface UserConfig {
  infrastructure?: {
    network?: {
      name: string
      subnet: string
      [key: string]: unknown
    }
    services?: {
      [serviceName: string]: {
        container_name: string
        [key: string]: unknown
      }
    }
  }
  features?: {
    [feature: string]: boolean
  }
  providers?: {
    [providerType: string]: string
  }
  provider_config?: {
    [key: string]: unknown
  }
  models?: {
    cloud?: string[]
    local?: string[]
  }
  marketplace_services?: {
    [serviceId: string]: {
      enabled: boolean
      config: Record<string, any>
    }
  }
  litellm?: {
    database_url?: string
    drop_params?: boolean
  }
  local_inference?: {
    groups?: Record<string, unknown>
    defaults?: Record<string, unknown>
  }
  tailscale?: {
    full_hostname: string
    hostname: string
    tailnet: string
  }
}

/**
 * Configuration creation input
 */
export interface CreateConfigurationInput {
  release_id?: string
  config_data: UserConfig | ReleaseConfig
  schema_version: string
}

/**
 * Validate configuration data structure (UserConfig)
 */
export function isValidConfiguration(config: unknown): config is UserConfig {
  if (!config || typeof config !== 'object') {
    return false
  }

  // Basic validation - at minimum should have infrastructure or features
  const cfg = config as UserConfig
  return !!(cfg.infrastructure || cfg.features || cfg.providers)
}

/**
 * Validate release configuration structure
 */
export function isValidReleaseConfig(config: unknown): config is ReleaseConfig {
  if (!config || typeof config !== 'object') {
    return false
  }

  const cfg = config as any

  // Check required top-level properties
  if (!cfg.release_metadata || typeof cfg.release_metadata !== 'object') {
    return false
  }

  if (!cfg.core_services || typeof cfg.core_services !== 'object') {
    return false
  }

  if (!cfg.caddy_routes || typeof cfg.caddy_routes !== 'object') {
    return false
  }

  if (!cfg.infrastructure || typeof cfg.infrastructure !== 'object') {
    return false
  }

  // Check required metadata fields
  if (!cfg.release_metadata.name || typeof cfg.release_metadata.name !== 'string') {
    return false
  }

  if (!cfg.release_metadata.version || typeof cfg.release_metadata.version !== 'string') {
    return false
  }

  // Check required infrastructure fields
  if (!cfg.infrastructure.network || typeof cfg.infrastructure.network !== 'object') {
    return false
  }

  return true
}
