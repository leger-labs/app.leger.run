/**
 * Configuration data models
 * For storing user configurations (schema.json format) in D1
 */

/**
 * Configuration record stored in D1
 */
export interface ConfigurationRecord {
  id: string // UUID v4
  user_uuid: string // Owner
  release_id: string | null // Optional link to release
  config_data: string // JSON string of user configuration
  schema_version: string // Schema version (e.g., "0.2.0")
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
  secrets?: {
    [key: string]: string
  }
  models?: {
    cloud?: string[]
    local?: string[]
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
  config_data: UserConfig
  schema_version: string
}

/**
 * Validate configuration data structure
 */
export function isValidConfiguration(config: unknown): config is UserConfig {
  if (!config || typeof config !== 'object') {
    return false
  }

  // Basic validation - at minimum should have infrastructure or features
  const cfg = config as UserConfig
  return !!(cfg.infrastructure || cfg.features || cfg.providers)
}
