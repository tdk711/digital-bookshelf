import Dexie from 'dexie'
import dexieCloud from 'dexie-cloud-addon'

// Database URL resolution order:
//   1. VITE_DEXIE_CLOUD_URL env var (required for builds where dexie-cloud.json
//      is absent, e.g. Vercel CI, because the file is gitignored)
//   2. dexie-cloud.json in the project root (local development)
let databaseUrl = import.meta.env.VITE_DEXIE_CLOUD_URL
if (!databaseUrl) {
  try {
    const mod = (await import('../../dexie-cloud.json')).default
    databaseUrl = mod?.dbUrl ?? mod?.databaseUrl
  } catch {
    console.error(
      'Dexie Cloud: no database URL. Set VITE_DEXIE_CLOUD_URL (e.g. https://zz0j0iydm.dexie.cloud) or provide dexie-cloud.json.'
    )
  }
}

// NOTE: the IndexedDB database name was bumped from 'digital_bookshelf' to
// ..._v2 because Dexie cannot change an existing store's primary key in place
// (upgrade throws "Not yet support for changing primary key"). The CLOUD is
// the source of truth: the legacy local DB is discarded (not migrated) and
// everything is downloaded from the cloud via the initial sync after sign-in.
export const DB_NAME = 'digital_bookshelf_v2'
// The cloud addon stores the local IndexedDB under '<db name>-<cloud db id>'
// (e.g. digital_bookshelf-zz0j0iydm), so derive the legacy name the same way.
export const LEGACY_DB_NAME = databaseUrl
  ? `digital_bookshelf-${new URL(databaseUrl).hostname.split('.')[0]}`
  : 'digital_bookshelf'

export const db = new Dexie(DB_NAME, { addons: [dexieCloud] })

// Dexie Cloud requires client-generated non-auto-increment primary keys for
// synced tables, so we use 'id' string keys (crypto.randomUUID()).
// (The earlier '++id' numeric keys made dexie-cloud reject the schema with
// SchemaError the moment sync started after sign-in.)
db.version(1).stores({
  games: 'id, name, status',
  music: 'id, name, status'
})

// ---------- Dexie Cloud (sync + email OTP auth) ----------
db.cloud.configure({
  ...(databaseUrl ? { databaseUrl } : {}),
  requireAuth: true, // don't expose data before the user has signed in
  customLoginGui: true // we render our own login/OTP dialogs (LoginGui.svelte)
})

// ---------- discard the legacy local DB (cloud is the source of truth) ----------
// The old local database used auto-increment keys (unsyncable) and may hold
// stale data. Rather than merging it into the cloud, it is simply deleted;
// after sign-in Dexie Cloud runs an initial full DOWNLOAD that rebuilds the
// fresh local DB from the server's state.
Dexie.delete(LEGACY_DB_NAME).catch(() => {})

// ---------- media type metadata ----------
export const MEDIA_TYPES = {
  music: {
    label: 'Music',
    cardLabel: 'Music',
    currentLabel: 'Currently Listening',
    dateField: 'dateListened',
    startedLabel: 'Date Listened'
  },
  games: {
    label: 'Video Games',
    cardLabel: 'Video Games',
    currentLabel: 'Currently Playing',
    dateField: 'dateStarted',
    startedLabel: 'Date Started'
  }
}

// ---------- status definitions ----------
export const STATUS_ORDER = ['current', 'upcoming', 'finished', 'abandoned']

export const STATUS_LABELS = {
  games: {
    current: 'Currently Playing',
    upcoming: 'Upcoming',
    finished: 'Finished',
    abandoned: 'Abandoned'
  },
  music: {
    current: 'Currently Listening',
    upcoming: 'Upcoming',
    finished: 'Finished',
    abandoned: 'Abandoned'
  }
}

// background + text color classes per status
export const STATUS_COLOR = {
  finished: 'bg-green-100 text-green-800 dark:bg-green-900/60 dark:text-green-200',
  current: 'bg-red-100 text-red-800 dark:bg-red-900/60 dark:text-red-200',
  abandoned: 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  upcoming: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800/60 dark:text-yellow-200'
}

// ---------- sorting ----------
export function partitionRecords(list, type) {
  const started = r => r[MEDIA_TYPES[type].dateField] || ''
  const added = r => r.dateAdded || ''

  const byStartedDesc = (a, b) => (started(b) || '').localeCompare(started(a) || '')
  const byAddedAsc = (a, b) => (added(a) || '').localeCompare(added(b) || '')

  return {
    current: list.filter(r => r.status === 'current').sort(byStartedDesc),
    upcoming: list.filter(r => r.status === 'upcoming').sort(byAddedAsc),
    finished: list
      .filter(r => r.status === 'finished' || r.status === 'abandoned')
      .sort(byStartedDesc)
  }
}

// ---------- CRUD ----------
// plain deep clone: Svelte $state proxies cannot be written to IndexedDB
function plain(obj) {
  return obj === undefined ? obj : JSON.parse(JSON.stringify(obj))
}

// dateAdded is set automatically on first save; never user-editable.
// Primary keys are client-generated UUID strings (required by Dexie Cloud —
// synced tables may not use auto-increment).
export async function upsertRecord(type, record) {
  const data = plain({ ...record, name: record.name?.trim() || 'Untitled' })
  const now = new Date().toISOString()
  if (data.id) {
    data.dateAdded = data.dateAdded ?? now
    data.dateModified = now
    return db[type].put(data)
  }
  data.id = crypto.randomUUID()
  data.dateAdded = now
  data.dateModified = now
  return db[type].add(data)
}

export async function saveSongs(album) {
  const now = new Date().toISOString()
  const id = album.id ?? crypto.randomUUID()
  return db.music.put({ ...album, id, dateAdded: album.dateAdded ?? now, dateModified: now })
}

export async function deleteRecord(type, id) {
  return db[type].delete(id)
}