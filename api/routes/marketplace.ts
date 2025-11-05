/**
 * Marketplace routes
 * GET /api/marketplace/services - List all installed services
 * GET /api/marketplace/services/:serviceId - Get single service config
 * POST /api/marketplace/services - Install a service
 * PUT /api/marketplace/services/:serviceId - Update service config
 * DELETE /api/marketplace/services/:serviceId - Uninstall service
 */

import type { Env } from '../middleware/auth'
import {
  authenticateRequest,
  successResponse,
  errorResponse,
  handleError,
} from '../middleware/auth'
import type { InstallServiceInput, UpdateServiceInput, InstalledService } from '../models/marketplace'
import { isValidServiceConfig } from '../models/marketplace'

/**
 * GET /api/marketplace/services
 * List all installed services for user
 */
export async function handleListInstalledServices(request: Request, env: Env): Promise<Response> {
  try {
    const payload = await authenticateRequest(request, env)

    // TODO: Implement service listing from configuration
    // For now, return empty array
    const services: InstalledService[] = []

    return successResponse({ services })
  } catch (error) {
    return handleError(error)
  }
}

/**
 * GET /api/marketplace/services/:serviceId
 * Get single installed service configuration
 */
export async function handleGetInstalledService(
  request: Request,
  env: Env,
  serviceId: string
): Promise<Response> {
  try {
    const payload = await authenticateRequest(request, env)

    // TODO: Implement service lookup from configuration
    // For now, return not found
    return errorResponse('not_found', `Service '${serviceId}' not found`, 404)
  } catch (error) {
    return handleError(error)
  }
}

/**
 * POST /api/marketplace/services
 * Install a new service
 */
export async function handleInstallService(request: Request, env: Env): Promise<Response> {
  try {
    const payload = await authenticateRequest(request, env)

    // Parse request body
    const body = await request.json() as InstallServiceInput

    if (!body.serviceId) {
      return errorResponse(
        'validation_error',
        'Missing required field: serviceId',
        400
      )
    }

    if (!body.config || !isValidServiceConfig(body.config)) {
      return errorResponse(
        'validation_error',
        'Invalid service configuration',
        400
      )
    }

    // TODO: Implement service installation
    // 1. Load user's current configuration
    // 2. Add service to marketplace_services
    // 3. Save configuration
    // For now, return success stub
    const installedService: InstalledService = {
      serviceId: body.serviceId,
      enabled: true,
      config: body.config,
      installedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    return successResponse(installedService)
  } catch (error) {
    return handleError(error)
  }
}

/**
 * PUT /api/marketplace/services/:serviceId
 * Update installed service configuration
 */
export async function handleUpdateService(
  request: Request,
  env: Env,
  serviceId: string
): Promise<Response> {
  try {
    const payload = await authenticateRequest(request, env)

    // Parse request body
    const body = await request.json() as UpdateServiceInput

    if (body.config && !isValidServiceConfig(body.config)) {
      return errorResponse(
        'validation_error',
        'Invalid service configuration',
        400
      )
    }

    // TODO: Implement service update
    // 1. Load user's current configuration
    // 2. Update service in marketplace_services
    // 3. Save configuration
    // For now, return success stub
    const updatedService: InstalledService = {
      serviceId,
      enabled: body.enabled ?? true,
      config: body.config ?? {},
      installedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    return successResponse(updatedService)
  } catch (error) {
    return handleError(error)
  }
}

/**
 * DELETE /api/marketplace/services/:serviceId
 * Uninstall a service
 */
export async function handleUninstallService(
  request: Request,
  env: Env,
  serviceId: string
): Promise<Response> {
  try {
    const payload = await authenticateRequest(request, env)

    // TODO: Implement service uninstallation
    // 1. Load user's current configuration
    // 2. Remove service from marketplace_services
    // 3. Save configuration
    // For now, return success
    return successResponse({ message: `Service '${serviceId}' uninstalled` })
  } catch (error) {
    return handleError(error)
  }
}
