// Sync API Router for Cloudflare Worker + D1
// Endpoints:
// GET  /api/:table?updated_after=<ts>     - incremental pull
// POST /api/:table/sync                   - batch push from client outbox
// GET  /api/tables                        - list available tables

import type { Env, AuthResult } from './auth.js';

const TABLES = [
  'books',
  'games',
  'movies',
  'music',
  'songs',
  'tvshows',
  'episodes',
] as const;

type TableName = typeof TABLES[number];

const TABLE_SCHEMAS: Record<TableName, string[]> = {
  books: ['id', 'name', 'status', 'genre', 'rating', 'date_started', 'date_finished', 'image_url', 'review', 'date_added', 'date_modified', 'updated_at'],
  games: ['id', 'name', 'status', 'genre', 'rating', 'date_started', 'date_finished', 'image_url', 'review', 'platform', 'date_added', 'date_modified', 'updated_at'],
  movies: ['id', 'name', 'status', 'genre', 'rating', 'date_watched', 'image_url', 'review', 'date_added', 'date_modified', 'updated_at'],
  music: ['id', 'name', 'status', 'genre', 'rating', 'date_listened', 'image_url', 'review', 'artist', 'date_added', 'date_modified', 'updated_at'],
  songs: ['id', 'album_id', 'name', 'rating', 'date_listened', 'status', 'review', 'display_order', 'updated_at'],
  tvshows: ['id', 'name', 'status', 'genre', 'rating', 'date_started', 'date_finished', 'image_url', 'review', 'date_added', 'date_modified', 'updated_at'],
  episodes: ['id', 'season_id', 'name', 'rating', 'date_watched', 'status', 'review', 'display_order', 'updated_at'],
};

interface SyncRequest {
  operations: Array<{
    type: 'insert' | 'update' | 'delete';
    table: TableName;
    record: Record<string, unknown>;
  }>;
  clientId: string;
}

export async function syncRouter(
  request: Request,
  env: Env,
  auth: AuthResult
): Promise<Response> {
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/').filter(Boolean);
  // pathParts = ['api', 'books'] or ['api', 'books', 'sync'] or ['api', 'tables']

  if (pathParts.length < 2) {
    return jsonResponse({ error: 'Invalid API path' }, 400);
  }

  const table = pathParts[1] as TableName;
  const action = pathParts[2];

  // GET /api/tables - list available tables
  if (table === 'tables' && request.method === 'GET') {
    return jsonResponse({ tables: TABLES });
  }

  // Validate table name
  if (!TABLES.includes(table)) {
    return jsonResponse({ error: `Unknown table: ${table}` }, 404);
  }

  // GET /api/:table?updated_after=<ts> - incremental pull
  if (request.method === 'GET' && !action) {
    return handlePull(request, env, table, auth.clientId);
  }

  // POST /api/:table/sync - batch push
  if (request.method === 'POST' && action === 'sync') {
    return handlePush(request, env, table, auth.clientId);
  }

  return jsonResponse({ error: 'Method not allowed' }, 405);
}

// Incremental pull: return records updated after timestamp
async function handlePull(
  request: Request,
  env: Env,
  table: TableName,
  clientId: string
): Promise<Response> {
  const url = new URL(request.url);
  const updatedAfter = url.searchParams.get('updated_after');

  let query = `SELECT * FROM ${table}`;
  const params: string[] = [];

  if (updatedAfter) {
    query += ` WHERE updated_at > ?`;
    params.push(updatedAfter);
  }

  query += ` ORDER BY updated_at ASC LIMIT 1000`;

  const stmt = env.DB.prepare(query);
  const result = params.length > 0 ? await stmt.bind(...params).all() : await stmt.all();

  // Also return the current server timestamp for client to use as next updated_after
  const serverTime = await env.DB.prepare('SELECT datetime("now") as now').first<{ now: string }>();

  return jsonResponse({
    records: result.results,
    server_time: serverTime?.now ?? new Date().toISOString(),
    table,
    count: result.results.length,
  });
}

// Batch push: apply client operations with last-write-wins
async function handlePush(
  request: Request,
  env: Env,
  table: TableName,
  clientId: string
): Promise<Response> {
  let body: SyncRequest;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400);
  }

  if (!body.operations || !Array.isArray(body.operations)) {
    return jsonResponse({ error: 'Missing operations array' }, 400);
  }

  const results: Array<{ success: boolean; id?: string; error?: string }> = [];

  // Process each operation in a transaction
  const statements: D1PreparedStatement[] = [];

  for (const op of body.operations) {
    if (!TABLES.includes(op.table)) {
      results.push({ success: false, error: `Unknown table: ${op.table}` });
      continue;
    }

    try {
      if (op.type === 'delete') {
        const stmt = env.DB.prepare(`DELETE FROM ${op.table} WHERE id = ?`);
        statements.push(stmt.bind(op.record.id));
        results.push({ success: true, id: op.record.id });
      } else if (op.type === 'insert' || op.type === 'update') {
        const record = op.record as Record<string, unknown>;
        const columns = Object.keys(record);
        const placeholders = columns.map(() => '?').join(', ');
        const updates = columns.map(c => `${c} = excluded.${c}`).join(', ');

        // Upsert with last-write-wins on updated_at
        const sql = `
          INSERT INTO ${op.table} (${columns.join(', ')}, updated_at)
          VALUES (${placeholders}, datetime('now'))
          ON CONFLICT(id) DO UPDATE SET
            ${updates},
            updated_at = CASE
              WHEN excluded.updated_at > ${op.table}.updated_at THEN excluded.updated_at
              ELSE ${op.table}.updated_at
            END
        `;

        const values = columns.map(c => record[c]);
        const stmt = env.DB.prepare(sql);
        statements.push(stmt.bind(...values));
        results.push({ success: true, id: record.id as string });
      } else {
        results.push({ success: false, error: `Unknown operation: ${op.type}` });
      }
    } catch (e) {
      results.push({ success: false, error: String(e) });
    }
  }

  // Execute all statements in a batch
  if (statements.length > 0) {
    try {
      await env.DB.batch(statements);
    } catch (e) {
      return jsonResponse({ error: `Batch execution failed: ${e}` }, 500);
    }
  }

  // Update sync metadata
  await env.DB.prepare(`
    INSERT INTO sync_metadata (client_id, last_pull_ts, last_push_ts, updated_at)
    VALUES (?, datetime('now'), datetime('now'), datetime('now'))
    ON CONFLICT(client_id) DO UPDATE SET
      last_push_ts = datetime('now'),
      updated_at = datetime('now')
  `).bind(clientId).run();

  const serverTime = await env.DB.prepare('SELECT datetime("now") as now').first<{ now: string }>();

  return jsonResponse({
    results,
    server_time: serverTime?.now ?? new Date().toISOString(),
    processed: statements.length,
  });
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}