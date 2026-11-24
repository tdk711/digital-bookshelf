// Sync Client - handles communication with Cloudflare Worker sync API
// Manages outbox for offline-first writes, incremental pull, and conflict resolution

import { db, MEDIA_TYPES } from './db.js';
import { getAuthHeader, getClientId, onAuthChange } from './pin-auth.js';

const API_BASE = '/api';
const SYNC_INTERVAL = 30_000; // 30 seconds
const MAX_RETRIES = 3;

interface OutboxEntry {
  id?: number;
  table: string;
  operation: 'insert' | 'update' | 'delete';
  recordId: string;
  payload: Record<string, unknown>;
  createdAt: string;
  retries: number;
}

interface SyncResult {
  success: boolean;
  serverTime?: string;
  error?: string;
}

let syncTimer: number | null = null;
let isSyncing = false;
let lastPullTime: Record<string, string> = {};
let syncListeners: Set<(status: SyncStatus) => void> = new Set();

export interface SyncStatus {
  isSyncing: boolean;
  lastSync: string | null;
  pendingChanges: number;
  error: string | null;
}

let currentStatus: SyncStatus = {
  isSyncing: false,
  lastSync: null,
  pendingChanges: 0,
  error: null,
};

function notifyStatus() {
  syncListeners.forEach(cb => cb({ ...currentStatus }));
}

function updateStatus(partial: Partial<SyncStatus>) {
  currentStatus = { ...currentStatus, ...partial };
  notifyStatus();
}

// Initialize sync system when auth becomes available
onAuthChange(state => {
  if (!state.isLocked && state.token) {
    startSync();
    loadLastPullTimes();
  } else {
    stopSync();
  }
});

/** Start periodic sync */
export function startSync(): void {
  if (syncTimer) return;
  syncNow(); // Initial sync
  syncTimer = window.setInterval(syncNow, SYNC_INTERVAL);
}

/** Stop periodic sync */
export function stopSync(): void {
  if (syncTimer) {
    clearInterval(syncTimer);
    syncTimer = null;
  }
}

/** Subscribe to sync status changes */
export function onSyncStatus(listener: (status: SyncStatus) => void): () => void {
  syncListeners.add(listener);
  return () => syncListeners.delete(listener);
}

/** Get current sync status */
export function getSyncStatus(): SyncStatus {
  return { ...currentStatus };
}

/** Trigger immediate sync */
export async function syncNow(): Promise<SyncResult> {
  if (isSyncing || !getAuthHeader()) return { success: false, error: 'Not authenticated or already syncing' };

  isSyncing = true;
  updateStatus({ isSyncing: true, error: null });

  try {
    // 1. Push local changes (outbox)
    await pushOutbox();

    // 2. Pull remote changes for each table
    for (const table of Object.keys(MEDIA_TYPES)) {
      await pullTable(table);
    }

    // 3. Also pull nested tables (songs, episodes)
    await pullTable('songs');
    await pullTable('episodes');

    const serverTime = new Date().toISOString();
    updateStatus({
      isSyncing: false,
      lastSync: serverTime,
      pendingChanges: await getOutboxCount(),
      error: null,
    });

    return { success: true, serverTime };
  } catch (e) {
    const error = String(e);
    updateStatus({ isSyncing: false, error });
    console.error('Sync failed:', e);
    return { success: false, error };
  } finally {
    isSyncing = false;
  }
}

/** Push pending outbox entries to server */
async function pushOutbox(): Promise<void> {
  const authHeader = getAuthHeader();
  if (!authHeader) throw new Error('No auth header');

  const outbox = await getOutboxEntries();
  if (outbox.length === 0) return;

  // Group by table for batch API calls
  const byTable = new Map<string, typeof outbox>();
  for (const entry of outbox) {
    const arr = byTable.get(entry.table) || [];
    arr.push(entry);
    byTable.set(entry.table, arr);
  }

  for (const [table, entries] of byTable) {
    const operations = entries.map(e => ({
      type: e.operation,
      table: e.table as any,
      record: e.payload,
    }));

    const response = await fetch(`${API_BASE}/${table}/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      body: JSON.stringify({ operations, clientId: getClientId() }),
    });

    if (!response.ok) {
      if (response.status === 401) throw new Error('Authentication failed');
      throw new Error(`Push failed: ${response.statusText}`);
    }

    const result = await response.json();

    // Mark successful entries as synced
    for (let i = 0; i < entries.length; i++) {
      if (result.results[i]?.success) {
        await markOutboxSynced(entries[i].id!);
      } else {
        await incrementOutboxRetry(entries[i].id!);
      }
    }
  }
}

/** Pull remote changes for a table since last pull */
async function pullTable(table: string): Promise<void> {
  const authHeader = getAuthHeader();
  if (!authHeader) throw new Error('No auth header');

  const since = lastPullTime[table] || '1970-01-01T00:00:00.000Z';
  const url = `${API_BASE}/${table}?updated_after=${encodeURIComponent(since)}`;

  const response = await fetch(url, {
    headers: { Authorization: authHeader },
  });

  if (!response.ok) {
    if (response.status === 401) throw new Error('Authentication failed');
    throw new Error(`Pull failed for ${table}: ${response.statusText}`);
  }

  const result = await response.json();
  if (result.records && result.records.length > 0) {
    await applyRemoteRecords(table, result.records);
    lastPullTime[table] = result.server_time;
    await saveLastPullTime(table, result.server_time);
  }
}

/** Apply remote records to local IndexedDB (last-write-wins on updated_at) */
async function applyRemoteRecords(table: string, records: Record<string, unknown>[]): Promise<void> {
  for (const record of records) {
    const local = await db[table].get(record.id as string);

    if (!local) {
      // New record from server
      await db[table].put(record);
    } else {
      // Conflict: server wins (source of truth)
      const localUpdated = local.updated_at || local.dateModified || '1970-01-01';
      const serverUpdated = record.updated_at as string || '1970-01-01';

      if (serverUpdated > localUpdated) {
        await db[table].put(record);
      }
      // If local is newer, keep local (will be pushed on next sync)
    }
  }
}

/** Add entry to outbox for later push */
export async function addToOutbox(
  table: string,
  operation: 'insert' | 'update' | 'delete',
  recordId: string,
  payload: Record<string, unknown>
): Promise<void> {
  const entry: OutboxEntry = {
    table,
    operation,
    recordId,
    payload,
    createdAt: new Date().toISOString(),
    retries: 0,
  };

  // Use a simple outbox table in IndexedDB
  await db.outbox.add(entry as any);
  updateStatus({ pendingChanges: await getOutboxCount() });
}

/** Get all unsynced outbox entries */
async function getOutboxEntries(): Promise<OutboxEntry[]> {
  return (await db.outbox.where('synced_at').equals(null).toArray()) as OutboxEntry[];
}

/** Get count of unsynced entries */
async function getOutboxCount(): Promise<number> {
  return await db.outbox.where('synced_at').equals(null).count();
}

/** Mark outbox entry as synced */
async function markOutboxSynced(id: number): Promise<void> {
  await db.outbox.update(id, { synced_at: new Date().toISOString() });
  updateStatus({ pendingChanges: await getOutboxCount() });
}

/** Increment retry count for failed entry */
async function incrementOutboxRetry(id: number): Promise<void> {
  const entry = await db.outbox.get(id);
  if (entry && (entry as any).retries < MAX_RETRIES) {
    await db.outbox.update(id, { retries: (entry as any).retries + 1 });
  }
}

/** Load last pull times from localStorage */
async function loadLastPullTimes(): Promise<void> {
  try {
    const stored = localStorage.getItem('bookshelf:lastPullTimes');
    if (stored) lastPullTime = JSON.parse(stored);
  } catch {
    lastPullTime = {};
  }
}

/** Save last pull time for a table */
async function saveLastPullTime(table: string, time: string): Promise<void> {
  lastPullTime[table] = time;
  localStorage.setItem('bookshelf:lastPullTimes', JSON.stringify(lastPullTime));
}

/** Force full re-sync (pull all records) */
export async function fullResync(): Promise<SyncResult> {
  lastPullTime = {};
  localStorage.removeItem('bookshelf:lastPullTimes');
  return syncNow();
}