/**
 * Authentication routes
 * POST /api/auth/cli - CLI authentication endpoint (returns JWT)
 * POST /api/auth/login - Web authentication (returns JWT)
 * POST /api/auth/validate - Validate CLI-generated JWT
 */

import type { Env } from '../middleware/auth'
import { authenticateRequest, successResponse, errorResponse } from '../middleware/auth'
import { getUserByTailscaleId, createUser, updateLastSeen, toUserProfile } from '../services/user'
import { createJWT, type JWTPayload } from '../utils/jwt'

/**
 * POST /api/auth/cli
 * CLI authentication endpoint - accepts Tailscale identity in CLI format and returns JWT
 *
 * Request format:
 * {
 *   "tailscale": {
 *     "user_id": "u123456789",
 *     "login_name": "alice@github",
 *     "device_id": "100.1.1.1",
 *     "device_hostname": "alice-laptop",
 *     "tailnet": "example.github.ts.net"
 *   },
 *   "cli_version": "v0.1.9"
 * }
 *
 * Response format:
 * {
 *   "success": true,
 *   "data": {
 *     "token": "eyJhbGc...",
 *     "token_type": "Bearer",
 *     "expires_in": 31536000,
 *     "user_uuid": "uuid-v5-...",
 *     "user": {
 *       "tailscale_email": "alice@github",
 *       "display_name": null
 *     }
 *   }
 * }
 */
export async function handleAuthCli(request: Request, env: Env): Promise<Response> {
  try {
    // Parse request body
    let body: any
    try {
      body = await request.json()
    } catch {
      return errorResponse(
        'invalid_request',
        'Invalid JSON in request body',
        400,
        'Ensure your request contains valid JSON',
        'https://docs.leger.run/cli/authentication'
      )
    }

    // Validate request structure
    if (!body.tailscale || typeof body.tailscale !== 'object') {
      return errorResponse(
        'invalid_request',
        'Missing or invalid "tailscale" field in request body',
        400,
        'Ensure your CLI version is up to date',
        'https://docs.leger.run/cli/authentication'
      )
    }

    const { tailscale, cli_version } = body
    const { user_id, login_name, device_id, device_hostname, tailnet } = tailscale

    // Validate required Tailscale fields
    if (!user_id || !login_name || !tailnet) {
      return errorResponse(
        'tailscale_verification_failed',
        'Missing required Tailscale identity fields: user_id, login_name, tailnet',
        400,
        'Ensure you are running the CLI within a Tailscale network',
        'https://docs.leger.run/cli/authentication'
      )
    }

    // For v1.0: Auto-accept all Tailscale identities (no strict verification)
    // Future versions may add webhook verification or allowlist checks

    // Check if user exists
    let user = await getUserByTailscaleId(env, user_id)

    if (!user) {
      // Create new user
      try {
        user = await createUser(env, {
          tailscale_user_id: user_id,
          tailscale_email: login_name,
          tailnet: tailnet,
          device_id: device_id || device_hostname || 'unknown',
          cli_version: cli_version,
        })
      } catch (error) {
        console.error('Failed to create user:', error)
        return errorResponse(
          'account_not_linked',
          'Failed to create user account',
          500,
          'Please try again or contact support',
          'https://docs.leger.run/cli/authentication'
        )
      }
    } else {
      // Update last seen for existing user
      try {
        await updateLastSeen(env, user.user_uuid, device_id || device_hostname || 'unknown')
      } catch (error) {
        console.error('Failed to update last seen:', error)
        // Non-fatal error, continue with authentication
      }
    }

    // Generate JWT with 1 year expiration
    const now = Math.floor(Date.now() / 1000)
    const expiresIn = 365 * 24 * 60 * 60 // 1 year in seconds
    const payload: JWTPayload = {
      sub: user.user_uuid,
      tailscale_user_id: user_id,
      email: login_name,
      tailnet: tailnet,
      iat: now,
      exp: now + expiresIn,
    }

    let token: string
    try {
      token = await createJWT(payload, env.JWT_SECRET)
    } catch (error) {
      console.error('Failed to create JWT:', error)
      return errorResponse(
        'invalid_token',
        'Failed to generate authentication token',
        500,
        'Please try again or contact support',
        'https://docs.leger.run/cli/authentication'
      )
    }

    // Return in CLI-expected format
    return successResponse({
      token,
      token_type: 'Bearer',
      expires_in: expiresIn,
      user_uuid: user.user_uuid,
      user: {
        tailscale_email: user.tailscale_email,
        display_name: user.display_name,
      },
    })
  } catch (error) {
    console.error('Auth CLI error:', error)

    if (error instanceof Error) {
      return errorResponse(
        'authentication_failed',
        error.message,
        500,
        'Please check your Tailscale connection and try again',
        'https://docs.leger.run/cli/authentication'
      )
    }

    return errorResponse(
      'authentication_failed',
      'An unexpected error occurred during authentication',
      500,
      'Please try again or contact support',
      'https://docs.leger.run/cli/authentication'
    )
  }
}

/**
 * POST /api/auth/login
 * Web authentication endpoint - accepts Tailscale identity and returns JWT
 */
export async function handleAuthLogin(request: Request, env: Env): Promise<Response> {
  try {
    // Parse request body
    const body = await request.json()

    // Validate required fields
    if (!body.tailscale_user_id || !body.email || !body.tailnet) {
      return errorResponse(
        'validation_error',
        'Missing required fields: tailscale_user_id, email, tailnet',
        400,
        'Ensure your Tailscale CLI is up to date',
        'https://docs.leger.run/authentication'
      )
    }

    const { tailscale_user_id, email, tailnet, device_id, cli_version } = body

    // Check if user exists
    let user = await getUserByTailscaleId(env, tailscale_user_id)

    if (!user) {
      // Create new user
      user = await createUser(env, {
        tailscale_user_id,
        tailscale_email: email,
        tailnet,
        device_id: device_id || 'unknown',
        cli_version,
      })
    } else {
      // Update last seen for existing user
      await updateLastSeen(env, user.user_uuid, device_id || 'unknown')
    }

    // Generate JWT
    const now = Math.floor(Date.now() / 1000)
    const payload: JWTPayload = {
      sub: user.user_uuid,
      tailscale_user_id,
      email,
      tailnet,
      iat: now,
      exp: now + 30 * 24 * 60 * 60, // 30 days
    }

    const token = await createJWT(payload, env.JWT_SECRET)

    // Return JWT and user profile
    return successResponse({
      token,
      user: toUserProfile(user),
    })
  } catch (error) {
    console.error('Auth login error:', error)

    if (error instanceof Error) {
      return errorResponse(
        'authentication_failed',
        error.message,
        401,
        'Please check your Tailscale connection',
        'https://docs.leger.run/authentication'
      )
    }

    return errorResponse(
      'authentication_failed',
      'Authentication failed',
      401,
      'Please check your Tailscale connection',
      'https://docs.leger.run/authentication'
    )
  }
}

/**
 * POST /api/auth/validate
 * Validate CLI-generated JWT and establish web session
 */
export async function handleAuthValidate(request: Request, env: Env): Promise<Response> {
  try {
    // Validate JWT
    const payload = await authenticateRequest(request, env)

    // Extract the token from the Authorization header to return it
    const authHeader = request.headers.get('Authorization')
    const token = authHeader ? authHeader.substring(7) : '' // Remove "Bearer " prefix

    // Check if user exists
    let user = await getUserByTailscaleId(env, payload.tailscale_user_id)

    if (!user) {
      // Create new user
      user = await createUser(env, {
        tailscale_user_id: payload.tailscale_user_id,
        tailscale_email: payload.email,
        tailnet: payload.tailnet,
        device_id: 'web', // Web doesn't have device_id, use placeholder
        cli_version: undefined,
      })
    } else {
      // Update last seen for existing user
      await updateLastSeen(env, user.user_uuid, 'web')
    }

    // Return user profile with token
    return successResponse({
      token,
      user: toUserProfile(user),
    })
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(
        'authentication_failed',
        error.message,
        401,
        'Please run: leger auth login',
        'https://docs.leger.run/authentication'
      )
    }

    return errorResponse(
      'authentication_failed',
      'Invalid or expired JWT token',
      401,
      'Please run: leger auth login',
      'https://docs.leger.run/authentication'
    )
  }
}
