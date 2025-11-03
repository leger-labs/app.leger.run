/**
 * Deployments service
 * Handles deployment tracking in D1
 */

import type { Env } from '../middleware/auth'
import type {
  DeploymentRecord,
  CreateDeploymentInput,
  DeploymentStatus,
} from '../models/deployment'
import { generateUUIDv4 } from '../utils/uuid'

/**
 * Create new deployment record
 */
export async function createDeployment(
  env: Env,
  input: CreateDeploymentInput
): Promise<DeploymentRecord> {
  const now = new Date().toISOString()

  const deployment: DeploymentRecord = {
    id: generateUUIDv4(),
    release_id: input.release_id,
    user_uuid: input.user_uuid,
    status: 'rendering',
    r2_path: null,
    manifest_url: null,
    error_message: null,
    started_at: now,
    completed_at: null,
  }

  await env.LEGER_DB.prepare(
    `INSERT INTO deployments (
      id, release_id, user_uuid, status, r2_path, manifest_url,
      error_message, started_at, completed_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      deployment.id,
      deployment.release_id,
      deployment.user_uuid,
      deployment.status,
      deployment.r2_path,
      deployment.manifest_url,
      deployment.error_message,
      deployment.started_at,
      deployment.completed_at
    )
    .run()

  return deployment
}

/**
 * Get deployment by ID
 */
export async function getDeployment(
  env: Env,
  deploymentId: string
): Promise<DeploymentRecord | null> {
  const result = await env.LEGER_DB.prepare('SELECT * FROM deployments WHERE id = ?')
    .bind(deploymentId)
    .first<DeploymentRecord>()

  return result
}

/**
 * Get latest deployment for a release
 */
export async function getLatestDeployment(
  env: Env,
  userUuid: string,
  releaseId: string
): Promise<DeploymentRecord | null> {
  const result = await env.LEGER_DB.prepare(
    `SELECT * FROM deployments
     WHERE user_uuid = ? AND release_id = ?
     ORDER BY started_at DESC
     LIMIT 1`
  )
    .bind(userUuid, releaseId)
    .first<DeploymentRecord>()

  return result
}

/**
 * Update deployment status
 */
export async function updateDeploymentStatus(
  env: Env,
  deploymentId: string,
  status: DeploymentStatus,
  updates: {
    r2_path?: string
    manifest_url?: string
    error_message?: string
  } = {}
): Promise<void> {
  const setters: string[] = ['status = ?']
  const bindings: unknown[] = [status]

  // Add completion timestamp if status is terminal
  if (status === 'ready' || status === 'deployed' || status === 'failed') {
    setters.push('completed_at = ?')
    bindings.push(new Date().toISOString())
  }

  // Add optional updates
  if (updates.r2_path !== undefined) {
    setters.push('r2_path = ?')
    bindings.push(updates.r2_path)
  }

  if (updates.manifest_url !== undefined) {
    setters.push('manifest_url = ?')
    bindings.push(updates.manifest_url)
  }

  if (updates.error_message !== undefined) {
    setters.push('error_message = ?')
    bindings.push(updates.error_message)
  }

  bindings.push(deploymentId)

  await env.LEGER_DB.prepare(
    `UPDATE deployments SET ${setters.join(', ')} WHERE id = ?`
  )
    .bind(...bindings)
    .run()
}

/**
 * Delete deployments for a release
 */
export async function deleteDeploymentsForRelease(
  env: Env,
  userUuid: string,
  releaseId: string
): Promise<boolean> {
  await env.LEGER_DB.prepare(
    'DELETE FROM deployments WHERE user_uuid = ? AND release_id = ?'
  )
    .bind(userUuid, releaseId)
    .run()

  return true
}
