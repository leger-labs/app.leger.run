/**
 * Leger v0.1.0 Worker Entry Point
 * Complete API implementation with authentication, secrets, and releases
 */

import { handleAuthCli, handleAuthLogin, handleAuthValidate } from './routes/auth'
import {
  handleListSecrets,
  handleGetSecret,
  handleUpsertSecret,
  handleDeleteSecret,
  handleSetProviderSelection,
  handleGetProviderSelections,
} from './routes/secrets'
import {
  handleListReleases,
  handleGetRelease,
  handleCreateRelease,
  handleUpdateRelease,
  handleDeleteRelease,
  handleSaveConfiguration,
  handleGetConfiguration,
  handleValidateConfiguration,
  handleGenerateConfig,
  handleDeployRelease,
  handleGetDeployment,
} from './routes/releases'
import {
  handleListInstalledServices,
  handleGetInstalledService,
  handleInstallService,
  handleUpdateService,
  handleUninstallService,
} from './routes/marketplace'
import {
  handleGetSettings,
  handleUpdateSettings,
} from './routes/settings'
import {
  handleTestAuthLogin,
  handleTestListSecrets,
  handleTestGetSecret,
  handleTestUpsertSecret,
  handleTestDeleteSecret,
  handleTestListReleases,
  handleTestGetRelease,
  handleTestCreateRelease,
  handleTestUpdateRelease,
  handleTestDeleteRelease,
} from './routes/test'
import { errorResponse } from './middleware/auth'

export interface Env {
  ASSETS: Fetcher
  LEGER_USERS: KVNamespace
  LEGER_SECRETS: KVNamespace
  LEGER_STATIC: R2Bucket
  LEGER_DB: D1Database
  ENVIRONMENT: string
  APP_VERSION: string
  ENCRYPTION_KEY: string
  JWT_SECRET: string
}

/**
 * Main worker handler
 */
export default {
  async fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url)
    const hostname = url.hostname.toLowerCase()
    const originalPath = url.pathname
    const isApiHostname = hostname === 'api.leger.run'
    const isApiPath = originalPath.startsWith('/api/') || originalPath === '/api'
    const normalizedPath = (() => {
      if (originalPath.startsWith('/api/')) {
        return originalPath.substring(4) || '/'
      }
      if (originalPath === '/api') {
        return '/'
      }
      return originalPath
    })()

    // Handle health check endpoint (public, no auth)
    if (normalizedPath === '/health') {
      return new Response(
        JSON.stringify({
          status: 'healthy',
          service: 'leger-app',
          version: env.APP_VERSION || '0.1.0',
          timestamp: new Date().toISOString(),
          environment: env.ENVIRONMENT || 'production',
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
          },
        }
      )
    }

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400',
        },
      })
    }

    // Handle API routes
    if (isApiHostname || isApiPath) {
      try {
        // Add CORS headers to all API responses
        const addCorsHeaders = (response: Response): Response => {
          const headers = new Headers(response.headers)
          headers.set('Access-Control-Allow-Origin', '*')
          headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
          headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')

          return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers,
          })
        }

        // Handle root path on API hostname
        if (isApiHostname && normalizedPath === '/') {
          return addCorsHeaders(
            new Response(
              JSON.stringify({
                success: true,
                data: {
                  service: 'leger-api',
                  version: env.APP_VERSION || '0.1.0',
                  message: 'Leger API is running',
                  documentation: 'https://docs.leger.run/api',
                  endpoints: {
                    health: '/health',
                    auth: {
                      cli: '/auth/cli',
                      login: '/auth/login',
                      validate: '/auth/validate',
                    },
                    secrets: '/secrets',
                    settings: '/settings',
                    releases: '/releases',
                    marketplace: '/marketplace/services',
                  },
                },
              }),
              {
                status: 200,
                headers: {
                  'Content-Type': 'application/json',
                  'Cache-Control': 'no-cache, no-store, must-revalidate',
                },
              }
            )
          )
        }

        // Authentication routes
        if (normalizedPath === '/auth/cli' && request.method === 'POST') {
          return addCorsHeaders(await handleAuthCli(request, env))
        }

        if (normalizedPath === '/auth/login' && request.method === 'POST') {
          return addCorsHeaders(await handleAuthLogin(request, env))
        }

        if (normalizedPath === '/auth/validate' && request.method === 'POST') {
          return addCorsHeaders(await handleAuthValidate(request, env))
        }

        // Secrets routes
        if (normalizedPath === '/secrets' && request.method === 'GET') {
          return addCorsHeaders(await handleListSecrets(request, env))
        }

        if (
          normalizedPath === '/secrets/select-provider' &&
          request.method === 'POST'
        ) {
          return addCorsHeaders(await handleSetProviderSelection(request, env))
        }

        if (
          normalizedPath === '/secrets/selections' &&
          request.method === 'GET'
        ) {
          return addCorsHeaders(await handleGetProviderSelections(request, env))
        }

        if (normalizedPath.startsWith('/secrets/')) {
          const secretName = decodeURIComponent(
            normalizedPath.substring('/secrets/'.length)
          )

          if (request.method === 'GET') {
            return addCorsHeaders(await handleGetSecret(request, env, secretName))
          }

          if (request.method === 'POST') {
            return addCorsHeaders(await handleUpsertSecret(request, env, secretName))
          }

          if (request.method === 'DELETE') {
            return addCorsHeaders(await handleDeleteSecret(request, env, secretName))
          }
        }

        // Settings routes
        if (normalizedPath === '/settings') {
          if (request.method === 'GET') {
            return addCorsHeaders(await handleGetSettings(request, env))
          }

          if (request.method === 'POST') {
            return addCorsHeaders(await handleUpdateSettings(request, env))
          }
        }

        // Releases routes
        if (normalizedPath === '/releases') {
          if (request.method === 'GET') {
            return addCorsHeaders(await handleListReleases(request, env))
          }

          if (request.method === 'POST') {
            return addCorsHeaders(await handleCreateRelease(request, env))
          }
        }

        // Marketplace routes
        if (normalizedPath === '/marketplace/services') {
          if (request.method === 'GET') {
            return addCorsHeaders(await handleListInstalledServices(request, env))
          }

          if (request.method === 'POST') {
            return addCorsHeaders(await handleInstallService(request, env))
          }
        }

        if (normalizedPath.startsWith('/marketplace/services/')) {
          const serviceId = normalizedPath.substring('/marketplace/services/'.length)

          if (request.method === 'GET') {
            return addCorsHeaders(await handleGetInstalledService(request, env, serviceId))
          }

          if (request.method === 'PUT') {
            return addCorsHeaders(await handleUpdateService(request, env, serviceId))
          }

          if (request.method === 'DELETE') {
            return addCorsHeaders(await handleUninstallService(request, env, serviceId))
          }
        }

        if (normalizedPath.startsWith('/releases/')) {
          const pathParts = normalizedPath.substring('/releases/'.length).split('/')
          const releaseId = pathParts[0]
          const action = pathParts[1] || null

          // Handle /releases/:id/configuration
          if (action === 'configuration') {
            if (request.method === 'GET') {
              return addCorsHeaders(await handleGetConfiguration(request, env, releaseId))
            }
            if (request.method === 'POST') {
              return addCorsHeaders(await handleSaveConfiguration(request, env, releaseId))
            }
          }

          // Handle /releases/:id/validate
          if (action === 'validate' && request.method === 'POST') {
            return addCorsHeaders(await handleValidateConfiguration(request, env, releaseId))
          }

          // Handle /releases/:id/generate-config
          if (action === 'generate-config' && request.method === 'POST') {
            return addCorsHeaders(await handleGenerateConfig(request, env, releaseId))
          }

          // Handle /releases/:id/deploy
          if (action === 'deploy' && request.method === 'POST') {
            return addCorsHeaders(await handleDeployRelease(request, env, releaseId))
          }

          // Handle /releases/:id/deployment
          if (action === 'deployment' && request.method === 'GET') {
            return addCorsHeaders(await handleGetDeployment(request, env, releaseId))
          }

          // Handle standard CRUD operations on /releases/:id
          if (!action) {
            if (request.method === 'GET') {
              return addCorsHeaders(await handleGetRelease(request, env, releaseId))
            }

            if (request.method === 'PUT') {
              return addCorsHeaders(await handleUpdateRelease(request, env, releaseId))
            }

            if (request.method === 'DELETE') {
              return addCorsHeaders(await handleDeleteRelease(request, env, releaseId))
            }
          }
        }

        // Test routes (NO AUTHENTICATION) - for development
        // Test auth endpoint for web UI testing
        if (normalizedPath === '/test/auth/login' && request.method === 'POST') {
          return addCorsHeaders(await handleTestAuthLogin(request, env))
        }

        if (normalizedPath === '/test/secrets' && request.method === 'GET') {
          return addCorsHeaders(await handleTestListSecrets(request, env))
        }

        if (normalizedPath.startsWith('/test/secrets/')) {
          const secretName = decodeURIComponent(
            normalizedPath.substring('/test/secrets/'.length)
          )

          if (request.method === 'GET') {
            return addCorsHeaders(await handleTestGetSecret(request, env, secretName))
          }

          if (request.method === 'POST') {
            return addCorsHeaders(await handleTestUpsertSecret(request, env, secretName))
          }

          if (request.method === 'DELETE') {
            return addCorsHeaders(await handleTestDeleteSecret(request, env, secretName))
          }
        }

        if (normalizedPath === '/test/releases') {
          if (request.method === 'GET') {
            return addCorsHeaders(await handleTestListReleases(request, env))
          }

          if (request.method === 'POST') {
            return addCorsHeaders(await handleTestCreateRelease(request, env))
          }
        }

        if (normalizedPath.startsWith('/test/releases/')) {
          const releaseId = normalizedPath.substring('/test/releases/'.length)

          if (request.method === 'GET') {
            return addCorsHeaders(await handleTestGetRelease(request, env, releaseId))
          }

          if (request.method === 'PUT') {
            return addCorsHeaders(await handleTestUpdateRelease(request, env, releaseId))
          }

          if (request.method === 'DELETE') {
            return addCorsHeaders(await handleTestDeleteRelease(request, env, releaseId))
          }
        }

        // No matching route
        return addCorsHeaders(
          errorResponse(
            'not_found',
            `API endpoint not found: ${request.method} ${url.pathname}`,
            404
          )
        )
      } catch (error) {
        console.error('API Error:', error)

        return new Response(
          JSON.stringify({
            success: false,
            error: {
              code: 'internal_error',
              message: 'An unexpected error occurred',
            },
          }),
          {
            status: 500,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
          }
        )
      }
    }

    // For all other requests, serve the SPA
    return env.ASSETS.fetch(request)
  },
}
