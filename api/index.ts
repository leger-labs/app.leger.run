/**
 * Leger v0.1.0 Worker Entry Point
 * Minimal API routes and SPA serving
 */

export interface Env {
  ASSETS: Fetcher;
  LEGER_USERS: KVNamespace;
  LEGER_SECRETS: KVNamespace;
  LEGER_STATIC: R2Bucket;
  LEGER_DB: D1Database;
  ENVIRONMENT: string;
  APP_VERSION: string;
  ENCRYPTION_KEY: string;
  JWT_SECRET: string;
}

export default {
  async fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    
    // Handle health check endpoint
    if (url.pathname === '/health' || url.pathname === '/api/health') {
      return new Response(JSON.stringify({
        status: 'healthy',
        service: 'leger-app',
        version: env.APP_VERSION || '0.1.0',
        timestamp: new Date().toISOString(),
        environment: env.ENVIRONMENT || 'production'
      }), {
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      });
    }
    
    // Handle API routes (future expansion for v0.1.0 endpoints)
    if (url.pathname.startsWith('/api/')) {
      // Placeholder for:
      // - POST /api/auth/validate
      // - GET /api/secrets
      // - POST /api/secrets/:name
      // - GET /api/secrets/:name
      // - DELETE /api/secrets/:name
      // - GET /api/releases
      // - POST /api/releases
      // - GET /api/releases/:id
      // - PUT /api/releases/:id
      // - DELETE /api/releases/:id
      
      return new Response(JSON.stringify({
        error: 'API endpoint not implemented',
        message: 'This endpoint will be implemented in subsequent issues'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // For all other requests, let the assets handler take over
    // This will serve the SPA and handle client-side routing
    return env.ASSETS.fetch(request);
  },
};
