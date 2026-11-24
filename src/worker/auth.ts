// Auth middleware for Cloudflare Worker
// Verifies Authorization: Bearer <token> against env.SYNC_SECRET using timing-safe comparison

export interface AuthResult {
  token: string;
  clientId: string;
}

export async function authMiddleware(
  request: Request,
  env: { SYNC_SECRET: string }
): Promise<Response | AuthResult> {
  const authHeader = request.headers.get('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Missing or invalid Authorization header' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const token = authHeader.slice(7); // Remove 'Bearer ' prefix

  // Timing-safe comparison against SYNC_SECRET
  const expectedSecret = env.SYNC_SECRET;
  if (!expectedSecret) {
    console.error('SYNC_SECRET not configured');
    return new Response(JSON.stringify({ error: 'Server configuration error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const matches = await timingSafeEqualHex(token, expectedSecret);

  if (!matches) {
    return new Response(JSON.stringify({ error: 'Invalid authentication token' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Extract client ID from token (last 8 chars as identifier)
  const clientId = token.slice(-8);

  return { token, clientId };
}

// Timing-safe hex string comparison
async function timingSafeEqualHex(a: string, b: string): Promise<boolean> {
  if (a.length !== b.length) return false;

  // Use crypto.subtle.timingSafeEqual if available (Workers runtime)
  try {
    const encoder = new TextEncoder();
    const aBytes = encoder.encode(a);
    const bBytes = encoder.encode(b);
    // @ts-ignore - exists in Workers runtime
    return crypto.subtle.timingSafeEqual(aBytes, bBytes);
  } catch {
    // Fallback: constant-time comparison
    let diff = 0;
    for (let i = 0; i < a.length; i++) {
      diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return diff === 0;
  }
}