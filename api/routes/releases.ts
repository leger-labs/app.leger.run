/**
 * Releases routes
 * GET /api/releases - List all releases
 * GET /api/releases/:id - Get single release
 * POST /api/releases - Create new release
 * PUT /api/releases/:id - Update release
 * DELETE /api/releases/:id - Delete release
 * POST /api/releases/:id/configuration - Save configuration
 * GET /api/releases/:id/configuration - Get configuration
 * POST /api/releases/:id/validate - Validate release configuration
 * POST /api/releases/:id/generate-config - Generate user-config.json
 * POST /api/releases/:id/deploy - Deploy release
 * GET /api/releases/:id/deployment - Get deployment status
 */

import type { Env } from '../middleware/auth'
import {
  authenticateRequest,
  successResponse,
  errorResponse,
  handleError,
} from '../middleware/auth'
import {
  listReleases,
  getRelease,
  getReleaseByName,
  createRelease,
  updateRelease,
  deleteRelease,
} from '../services/releases'
import { saveConfiguration, getParsedConfiguration } from '../services/configurations'
import { orchestrateDeployment, getDeploymentStatus } from '../services/deployment-orchestrator'
import { generateUserConfig, validateReleaseConfig } from '../services/config-generator'
import { isValidReleaseConfig } from '../models/configuration'
import type { ReleaseConfig } from '../models/release-config'

/**
 * GET /api/releases
 * List all releases for user (with optional name filter for CLI)
 */
export async function handleListReleases(request: Request, env: Env): Promise<Response> {
  try {
    const payload = await authenticateRequest(request, env)

    // Check for name filter (for CLI lookup)
    const url = new URL(request.url)
    const name = url.searchParams.get('name')

    let releases
    if (name) {
      // Return single release by name (for CLI)
      const release = await getReleaseByName(env, payload.sub, name)
      releases = release ? [release] : []
    } else {
      // Return all releases
      releases = await listReleases(env, payload.sub)
    }

    return successResponse({ releases })
  } catch (error) {
    return handleError(error)
  }
}

/**
 * GET /api/releases/:id
 * Get single release by ID
 */
export async function handleGetRelease(
  request: Request,
  env: Env,
  releaseId: string
): Promise<Response> {
  try {
    const payload = await authenticateRequest(request, env)

    const release = await getRelease(env, payload.sub, releaseId)

    if (!release) {
      return errorResponse('not_found', `Release '${releaseId}' not found`, 404)
    }

    return successResponse(release)
  } catch (error) {
    return handleError(error)
  }
}

/**
 * POST /api/releases
 * Create new release
 */
export async function handleCreateRelease(request: Request, env: Env): Promise<Response> {
  try {
    const payload = await authenticateRequest(request, env)

    // Parse request body
    const body = await request.json()

    if (!body.name) {
      return errorResponse(
        'validation_error',
        'Missing required field: name',
        400
      )
    }

    const release = await createRelease(env, payload.sub, {
      name: body.name,
    })

    return successResponse(release, 201)
  } catch (error) {
    return handleError(error)
  }
}

/**
 * PUT /api/releases/:id
 * Update existing release
 */
export async function handleUpdateRelease(
  request: Request,
  env: Env,
  releaseId: string
): Promise<Response> {
  try {
    const payload = await authenticateRequest(request, env)

    // Parse request body
    const body = await request.json()

    const release = await updateRelease(env, payload.sub, releaseId, {
      name: body.name,
    })

    return successResponse(release)
  } catch (error) {
    return handleError(error)
  }
}

/**
 * DELETE /api/releases/:id
 * Delete release
 */
export async function handleDeleteRelease(
  request: Request,
  env: Env,
  releaseId: string
): Promise<Response> {
  try {
    const payload = await authenticateRequest(request, env)

    const deleted = await deleteRelease(env, payload.sub, releaseId)

    if (!deleted) {
      return errorResponse('not_found', `Release '${releaseId}' not found`, 404)
    }

    return successResponse({ deleted: true })
  } catch (error) {
    return handleError(error)
  }
}

/**
 * POST /api/releases/:id/configuration
 * Save configuration for a release
 */
export async function handleSaveConfiguration(
  request: Request,
  env: Env,
  releaseId: string
): Promise<Response> {
  try {
    const payload = await authenticateRequest(request, env)

    // Verify release exists and belongs to user
    const release = await getRelease(env, payload.sub, releaseId)
    if (!release) {
      return errorResponse('not_found', `Release '${releaseId}' not found`, 404)
    }

    // Parse request body
    const body = await request.json()

    if (!body.config_data) {
      return errorResponse('validation_error', 'Missing required field: config_data', 400)
    }

    // Save configuration
    const configuration = await saveConfiguration(env, payload.sub, {
      release_id: releaseId,
      config_data: body.config_data,
      schema_version: body.schema_version || '0.2.0',
    })

    return successResponse(configuration, 201)
  } catch (error) {
    return handleError(error)
  }
}

/**
 * POST /api/releases/:id/deploy
 * Deploy a release (render templates and upload to R2)
 */
export async function handleDeployRelease(
  request: Request,
  env: Env,
  releaseId: string
): Promise<Response> {
  try {
    const payload = await authenticateRequest(request, env)

    // Verify release exists and belongs to user
    const release = await getRelease(env, payload.sub, releaseId)
    if (!release) {
      return errorResponse('not_found', `Release '${releaseId}' not found`, 404)
    }

    // Start deployment orchestration
    const deployment = await orchestrateDeployment(env, payload.sub, releaseId)

    return successResponse(deployment, 202) // 202 Accepted (async operation)
  } catch (error) {
    return handleError(error)
  }
}

/**
 * GET /api/releases/:id/deployment
 * Get deployment status for a release
 */
export async function handleGetDeployment(
  request: Request,
  env: Env,
  releaseId: string
): Promise<Response> {
  try {
    const payload = await authenticateRequest(request, env)

    // Verify release exists and belongs to user
    const release = await getRelease(env, payload.sub, releaseId)
    if (!release) {
      return errorResponse('not_found', `Release '${releaseId}' not found`, 404)
    }

    // Get deployment status
    const status = await getDeploymentStatus(env, payload.sub, releaseId)

    return successResponse(status)
  } catch (error) {
    return handleError(error)
  }
}

/**
 * GET /api/releases/:id/configuration
 * Get configuration for a release
 */
export async function handleGetConfiguration(
  request: Request,
  env: Env,
  releaseId: string
): Promise<Response> {
  try {
    const payload = await authenticateRequest(request, env)

    // Verify release exists and belongs to user
    const release = await getRelease(env, payload.sub, releaseId)
    if (!release) {
      return errorResponse('not_found', `Release '${releaseId}' not found`, 404)
    }

    // Get configuration
    const config = await getParsedConfiguration(env, payload.sub, releaseId)

    if (!config) {
      return errorResponse('not_found', 'Configuration not found for this release', 404)
    }

    return successResponse({ config_data: config })
  } catch (error) {
    return handleError(error)
  }
}

/**
 * POST /api/releases/:id/validate
 * Validate release configuration
 */
export async function handleValidateConfiguration(
  request: Request,
  env: Env,
  releaseId: string
): Promise<Response> {
  try {
    const payload = await authenticateRequest(request, env)

    // Verify release exists and belongs to user
    const release = await getRelease(env, payload.sub, releaseId)
    if (!release) {
      return errorResponse('not_found', `Release '${releaseId}' not found`, 404)
    }

    // Parse request body
    const body = await request.json()

    if (!body.config_data) {
      return errorResponse('validation_error', 'Missing required field: config_data', 400)
    }

    // Validate structure
    if (!isValidReleaseConfig(body.config_data)) {
      return errorResponse('validation_error', 'Invalid release configuration structure', 400)
    }

    const releaseConfig = body.config_data as ReleaseConfig

    // Validate against dependencies
    const validation = await validateReleaseConfig(env, payload.sub, releaseConfig)

    return successResponse(validation)
  } catch (error) {
    return handleError(error)
  }
}

/**
 * POST /api/releases/:id/generate-config
 * Generate complete user-config.json for a release
 */
export async function handleGenerateConfig(
  request: Request,
  env: Env,
  releaseId: string
): Promise<Response> {
  try {
    const payload = await authenticateRequest(request, env)

    // Verify release exists and belongs to user
    const release = await getRelease(env, payload.sub, releaseId)
    if (!release) {
      return errorResponse('not_found', `Release '${releaseId}' not found`, 404)
    }

    // Generate user config
    const userConfig = await generateUserConfig(env, payload.sub, releaseId)

    return successResponse({ user_config: userConfig })
  } catch (error) {
    return handleError(error)
  }
}
