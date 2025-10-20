/**
 * Test routes (NO AUTHENTICATION)
 * These routes are for testing purposes only and bypass all authentication
 * Use a hardcoded test user ID for all operations
 *
 * Routes:
 * GET /api/test/secrets - List all secrets
 * GET /api/test/secrets/:name - Get single secret
 * POST /api/test/secrets/:name - Create or update secret
 * DELETE /api/test/secrets/:name - Delete secret
 * GET /api/test/releases - List all releases
 * GET /api/test/releases/:id - Get single release
 * POST /api/test/releases - Create release
 * PUT /api/test/releases/:id - Update release
 * DELETE /api/test/releases/:id - Delete release
 */

import type { Env } from '../middleware/auth'
import { successResponse, errorResponse, handleError } from '../middleware/auth'
import {
  listSecrets,
  getSecret,
  upsertSecret,
  deleteSecret,
} from '../services/secrets'
import {
  listReleases,
  getRelease,
  createRelease,
  updateRelease,
  deleteRelease,
} from '../services/releases'

// Hardcoded test user ID for all test operations
const TEST_USER_ID = 'test-user@leger.test'

/**
 * GET /api/test/secrets
 * List all secrets (no auth)
 */
export async function handleTestListSecrets(request: Request, env: Env): Promise<Response> {
  try {
    const url = new URL(request.url)
    const includeValues = url.searchParams.get('include_values') === 'true'

    const secrets = await listSecrets(env, TEST_USER_ID, includeValues)

    return successResponse({ secrets })
  } catch (error) {
    return handleError(error)
  }
}

/**
 * GET /api/test/secrets/:name
 * Get single secret (no auth)
 */
export async function handleTestGetSecret(
  request: Request,
  env: Env,
  secretName: string
): Promise<Response> {
  try {
    const secret = await getSecret(env, TEST_USER_ID, secretName, true)

    if (!secret) {
      return errorResponse('not_found', `Secret '${secretName}' not found`, 404)
    }

    return successResponse(secret)
  } catch (error) {
    return handleError(error)
  }
}

/**
 * POST /api/test/secrets/:name
 * Create or update secret (no auth)
 */
export async function handleTestUpsertSecret(
  request: Request,
  env: Env,
  secretName: string
): Promise<Response> {
  try {
    const body = await request.json()

    if (!body.value) {
      return errorResponse('validation_error', 'Missing required field: value', 400)
    }

    const secret = await upsertSecret(env, TEST_USER_ID, { value: body.value }, secretName)

    return successResponse(secret)
  } catch (error) {
    return handleError(error)
  }
}

/**
 * DELETE /api/test/secrets/:name
 * Delete secret (no auth)
 */
export async function handleTestDeleteSecret(
  request: Request,
  env: Env,
  secretName: string
): Promise<Response> {
  try {
    const deleted = await deleteSecret(env, TEST_USER_ID, secretName)

    if (!deleted) {
      return errorResponse('not_found', `Secret '${secretName}' not found`, 404)
    }

    return successResponse({ deleted: true })
  } catch (error) {
    return handleError(error)
  }
}

/**
 * GET /api/test/releases
 * List all releases (no auth)
 */
export async function handleTestListReleases(request: Request, env: Env): Promise<Response> {
  try {
    const releases = await listReleases(env, TEST_USER_ID)

    return successResponse({ releases })
  } catch (error) {
    return handleError(error)
  }
}

/**
 * GET /api/test/releases/:id
 * Get single release (no auth)
 */
export async function handleTestGetRelease(
  request: Request,
  env: Env,
  releaseId: string
): Promise<Response> {
  try {
    const release = await getRelease(env, TEST_USER_ID, releaseId)

    if (!release) {
      return errorResponse('not_found', `Release '${releaseId}' not found`, 404)
    }

    return successResponse(release)
  } catch (error) {
    return handleError(error)
  }
}

/**
 * POST /api/test/releases
 * Create release (no auth)
 */
export async function handleTestCreateRelease(request: Request, env: Env): Promise<Response> {
  try {
    const body = await request.json()

    // Validate required fields
    if (!body.name) {
      return errorResponse('validation_error', 'Missing required field: name', 400)
    }

    if (!body.git_url) {
      return errorResponse('validation_error', 'Missing required field: git_url', 400)
    }

    const release = await createRelease(env, TEST_USER_ID, body)

    return successResponse(release)
  } catch (error) {
    return handleError(error)
  }
}

/**
 * PUT /api/test/releases/:id
 * Update release (no auth)
 */
export async function handleTestUpdateRelease(
  request: Request,
  env: Env,
  releaseId: string
): Promise<Response> {
  try {
    const body = await request.json()

    const release = await updateRelease(env, TEST_USER_ID, releaseId, body)

    if (!release) {
      return errorResponse('not_found', `Release '${releaseId}' not found`, 404)
    }

    return successResponse(release)
  } catch (error) {
    return handleError(error)
  }
}

/**
 * DELETE /api/test/releases/:id
 * Delete release (no auth)
 */
export async function handleTestDeleteRelease(
  request: Request,
  env: Env,
  releaseId: string
): Promise<Response> {
  try {
    const deleted = await deleteRelease(env, TEST_USER_ID, releaseId)

    if (!deleted) {
      return errorResponse('not_found', `Release '${releaseId}' not found`, 404)
    }

    return successResponse({ deleted: true })
  } catch (error) {
    return handleError(error)
  }
}
