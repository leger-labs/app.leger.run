/**
 * Secrets routes
 * GET /api/secrets - List all secrets (with optional values for CLI)
 * GET /api/secrets/:name - Get single secret
 * POST /api/secrets/:name - Create or update secret
 * DELETE /api/secrets/:name - Delete secret
 */

import type { Env } from '../middleware/auth'
import {
  authenticateRequest,
  successResponse,
  errorResponse,
  handleError,
} from '../middleware/auth'
import {
  listSecrets,
  getSecret,
  upsertSecret,
  deleteSecret,
} from '../services/secrets'
import {
  getAllSelections,
  setSelectedSecret,
} from '../services/provider-selections'

/**
 * GET /api/secrets
 * List all secrets for user
 */
export async function handleListSecrets(request: Request, env: Env): Promise<Response> {
  try {
    const payload = await authenticateRequest(request, env)

    // Check if CLI wants values included
    const url = new URL(request.url)
    const includeValues = url.searchParams.get('include_values') === 'true'

    const secrets = await listSecrets(env, payload.sub, includeValues)

    return successResponse({ secrets })
  } catch (error) {
    return handleError(error)
  }
}

/**
 * GET /api/secrets/:name
 * Get single secret by name
 */
export async function handleGetSecret(
  request: Request,
  env: Env,
  secretName: string
): Promise<Response> {
  try {
    const payload = await authenticateRequest(request, env)

    const secret = await getSecret(env, payload.sub, secretName, true)

    if (!secret) {
      return errorResponse('not_found', `Secret '${secretName}' not found`, 404)
    }

    return successResponse(secret)
  } catch (error) {
    return handleError(error)
  }
}

/**
 * POST /api/secrets/:name
 * Create or update secret
 */
export async function handleUpsertSecret(
  request: Request,
  env: Env,
  secretName: string
): Promise<Response> {
  try {
    const payload = await authenticateRequest(request, env)

    // Parse request body
    const body = await request.json()

    if (!body.value) {
      return errorResponse('validation_error', 'Missing required field: value', 400)
    }

    const label = typeof body.label === 'string' ? body.label : undefined

    const secret = await upsertSecret(
      env,
      payload.sub,
      { value: body.value, label },
      secretName
    )

    return successResponse(secret)
  } catch (error) {
    return handleError(error)
  }
}

/**
 * POST /api/secrets/select-provider
 * Set which secret is selected for a provider
 */
export async function handleSetProviderSelection(
  request: Request,
  env: Env
): Promise<Response> {
  try {
    const payload = await authenticateRequest(request, env)
    const body = await request.json()

    const providerId = typeof body.provider_id === 'string' ? body.provider_id : ''
    const secretName = typeof body.secret_name === 'string' ? body.secret_name : ''

    if (!providerId || !secretName) {
      return errorResponse(
        'validation_error',
        'Missing required fields: provider_id, secret_name',
        400
      )
    }

    await setSelectedSecret(env, payload.sub, providerId, secretName)

    return successResponse({ success: true })
  } catch (error) {
    return handleError(error)
  }
}

/**
 * GET /api/secrets/selections
 * Get all provider selections
 */
export async function handleGetProviderSelections(
  request: Request,
  env: Env
): Promise<Response> {
  try {
    const payload = await authenticateRequest(request, env)
    const selections = await getAllSelections(env, payload.sub)

    return successResponse({ selections })
  } catch (error) {
    return handleError(error)
  }
}

/**
 * DELETE /api/secrets/:name
 * Delete secret
 */
export async function handleDeleteSecret(
  request: Request,
  env: Env,
  secretName: string
): Promise<Response> {
  try {
    const payload = await authenticateRequest(request, env)

    const deleted = await deleteSecret(env, payload.sub, secretName)

    if (!deleted) {
      return errorResponse('not_found', `Secret '${secretName}' not found`, 404)
    }

    return successResponse({ deleted: true })
  } catch (error) {
    return handleError(error)
  }
}
