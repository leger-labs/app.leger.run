/**
 * Configurations service
 * Handles configuration CRUD operations with D1
 */

import type { Env } from '../middleware/auth'
import type {
  ConfigurationRecord,
  CreateConfigurationInput,
  UserConfig,
} from '../models/configuration'
import { isValidConfiguration } from '../models/configuration'
import { generateUUIDv4 } from '../utils/uuid'

/**
 * Get configuration for a release
 */
export async function getConfiguration(
  env: Env,
  userUuid: string,
  releaseId: string
): Promise<ConfigurationRecord | null> {
  const result = await env.LEGER_DB.prepare(
    `SELECT * FROM configurations
     WHERE user_uuid = ? AND release_id = ?
     ORDER BY created_at DESC
     LIMIT 1`
  )
    .bind(userUuid, releaseId)
    .first<ConfigurationRecord>()

  return result
}

/**
 * Get parsed configuration data
 */
export async function getParsedConfiguration(
  env: Env,
  userUuid: string,
  releaseId: string
): Promise<UserConfig | null> {
  const config = await getConfiguration(env, userUuid, releaseId)

  if (!config) {
    return null
  }

  try {
    return JSON.parse(config.config_data) as UserConfig
  } catch {
    throw new Error('Invalid configuration data format')
  }
}

/**
 * Save configuration for a release
 */
export async function saveConfiguration(
  env: Env,
  userUuid: string,
  input: CreateConfigurationInput
): Promise<ConfigurationRecord> {
  // Validate configuration structure
  if (!isValidConfiguration(input.config_data)) {
    throw new Error('Invalid configuration structure')
  }

  // Get version number
  let version = 1
  if (input.release_id) {
    const versionResult = await env.LEGER_DB.prepare(
      'SELECT MAX(version) as max_version FROM configurations WHERE release_id = ?'
    )
      .bind(input.release_id)
      .first<{ max_version: number | null }>()

    version = (versionResult?.max_version || 0) + 1
  }

  const now = new Date().toISOString()

  const configuration: ConfigurationRecord = {
    id: generateUUIDv4(),
    user_uuid: userUuid,
    release_id: input.release_id || null,
    config_data: JSON.stringify(input.config_data),
    schema_version: input.schema_version,
    version,
    created_at: now,
  }

  // Insert into D1
  await env.LEGER_DB.prepare(
    `INSERT INTO configurations (
      id, user_uuid, release_id, config_data, schema_version, version, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      configuration.id,
      configuration.user_uuid,
      configuration.release_id,
      configuration.config_data,
      configuration.schema_version,
      configuration.version,
      configuration.created_at
    )
    .run()

  return configuration
}

/**
 * Delete all configurations for a release
 */
export async function deleteConfigurationsForRelease(
  env: Env,
  userUuid: string,
  releaseId: string
): Promise<boolean> {
  await env.LEGER_DB.prepare(
    'DELETE FROM configurations WHERE user_uuid = ? AND release_id = ?'
  )
    .bind(userUuid, releaseId)
    .run()

  return true
}
