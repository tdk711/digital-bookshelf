import { syncRouter } from './sync.js';
import { authMiddleware } from './auth.js';

export interface Env {
  DB: D1Database;
  SYNC_SECRET: string;
  PIN_SALT: string;
  ASSETS: Fetcher;
  // SESSIONS?: KVNamespace;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // API routes - apply auth middleware
    if (url.pathname.startsWith('/api/')) {
      const authResult = await authMiddleware(request, env);
      if (authResult instanceof Response) return authResult;
      return syncRouter(request, env, authResult);
    }

    // Static assets / SPA fallback
    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;