/**
 * Authentication routes
 * POST /api/auth/login - CLI authentication (returns JWT)
 * POST /api/auth/validate - Validate CLI-generated JWT
 */

import type { Env } from '../middleware/auth'
import { authenticateRequest, successResponse, errorResponse } from '../middleware/auth'
import { getUserByTailscaleId, createUser, updateLastSeen, toUserProfile } from '../services/user'
import { createJWT, type JWTPayload } from '../utils/jwt'

/**
 * POST /api/auth/login
 * CLI authentication endpoint - accepts Tailscale identity and returns JWT
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

    // Return user profile
    return successResponse({
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
