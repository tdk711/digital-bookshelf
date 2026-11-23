import Dexie from 'dexie'
import dexieCloud from 'dexie-cloud-addon'

// Database URL resolution order:
//   1. VITE_DEXIE_CLOUD_URL env var (required for builds where dexie-cloud.json
//      is absent, e.g. Vercel CI, because the file is gitignored)
//   2. dexie-cloud.json in the project root (local development)
// We must NOT use a plain dynamic import for the JSON: Vite resolves literal
// import paths at BUILD time and fails ("could not resolve ...") when the
// gitignored file is missing — import.meta.glob instead matches nothing
// silently, so remote builds succeed with the env var supplying the URL.
let databaseUrl = import.meta.env.VITE_DEXIE_CLOUD_URL
if (!databaseUrl) {
  const [cloudJson] = Object.values(
    import.meta.glob('../../dexie-cloud.json', { eager: true, import: 'default' })
  )
  databaseUrl = cloudJson?.dbUrl ?? cloudJson?.databaseUrl
  if (!databaseUrl) {
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

// v2 adds the books table. Dexie carries unchanged stores over between
// versions automatically; they are repeated here so the whole schema stays
// readable in one place.
db.version(2).stores({
  books: 'id, name, status',
  games: 'id, name, status',
  music: 'id, name, status'
})

// v3 adds movies and TV seasons (episodes are embedded in the season record,
// like songs are embedded in an album).
db.version(3).stores({
  books: 'id, name, status',
  games: 'id, name, status',
  movies: 'id, name, status',
  music: 'id, name, status',
  tvshows: 'id, name, status'
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
// One entry per synced table. Adding a type here (plus its Dexie store) is
// all that is needed for the sidebar, landing page, generic record cards and
// the record modal to pick it up.
export const MEDIA_TYPES = {
  books: {
    label: 'Books',
    singular: 'Book',
    cardLabel: 'Books',
    currentLabel: 'Currently Reading',
    dateField: 'dateStarted',
    startedLabel: 'Date Started',
    dates: [
      { field: 'dateStarted', label: 'Date started' },
      { field: 'dateFinished', label: 'Date finished' }
    ],
    namePlaceholder: 'Book title',
    genrePlaceholder: 'e.g. Fantasy / Biography',
    tagline: 'What you are reading, and what is next.',
    reviewPlaceholder: 'What did you think of it?',
    aspect: 'aspect-[2/3]',
    emoji: '📚',
    icon: 'M12 6.5C10.5 5 8.5 4.5 6 4.5c-1 0-1.7.1-2 .2v13c.3-.1 1-.2 2-.2 2.5 0 4.5.5 6 2 1.5-1.5 3.5-2 6-2 1 0 1.7.1 2 .2v-13c-.3-.1-1-.2-2-.2-2.5 0-4.5.5-6 2Zm0 0v13'
  },
  games: {
    label: 'Video Games',
    singular: 'Game',
    cardLabel: 'Video Games',
    currentLabel: 'Currently Playing',
    dateField: 'dateStarted',
    startedLabel: 'Date Started',
    dates: [
      { field: 'dateStarted', label: 'Date started' },
      { field: 'dateFinished', label: 'Date finished' }
    ],
    namePlaceholder: 'Game title',
    genrePlaceholder: 'e.g. RPG / Platformer',
    tagline: 'Your backlog, in progress and completed.',
    reviewPlaceholder: 'How did it play?',
    aspect: 'aspect-[3/4]',
    emoji: '🎮',
    icon: 'M7.8 7h8.4a4.8 4.8 0 0 1 4.77 4.3l.33 3.13A3.6 3.6 0 0 1 14.9 17.4l-.9-.9a1.5 1.5 0 0 0-1.06-.44h-1.88a1.5 1.5 0 0 0-1.06.44l-.9.9a3.6 3.6 0 0 1-6.4-2.97l.33-3.13A4.8 4.8 0 0 1 7.8 7ZM7.5 10.5v4M5.5 12.5h4M16.2 11h.01M17.4 13.2h.01'
  },
  movies: {
    label: 'Movies',
    singular: 'Movie',
    cardLabel: 'Movies',
    currentLabel: 'Currently Watching',
    dateField: 'dateWatched',
    startedLabel: 'Date Watched',
    dates: [{ field: 'dateWatched', label: 'Date watched' }],
    namePlaceholder: 'Movie title',
    genrePlaceholder: 'e.g. Drama / Sci-Fi',
    tagline: 'What you are watching, and what you loved.',
    reviewPlaceholder: 'What did you think of it?',
    aspect: 'aspect-[2/3]',
    emoji: '🎬',
    icon: 'M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Zm3 0v14M17 5v14M3 9h4M3 15h4M17 9h4M17 15h4'
  },
  music: {
    label: 'Music',
    singular: 'Album',
    cardLabel: 'Music',
    currentLabel: 'Currently Listening',
    dateField: 'dateListened',
    startedLabel: 'Date Listened',
    dates: [{ field: 'dateListened', label: 'Date listened' }],
    namePlaceholder: 'Album title',
    genrePlaceholder: 'e.g. Jazz / Alternative',
    tagline: 'Albums you keep coming back to.',
    reviewPlaceholder: 'What did you think of it?',
    aspect: 'aspect-square',
    emoji: '🎵',
    icon: 'M9 18V5l12-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm12-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
    nested: {
      key: 'songs',
      title: 'Songs',
      itemLabel: 'Song',
      addLabel: '+ Add song',
      nameLabel: 'Song name',
      dateField: 'dateListened',
      dateLabel: 'Date listened',
      emptyText: 'No songs yet. Add songs for this album.'
    }
  },
  tvshows: {
    label: 'TV Shows',
    singular: 'Season',
    cardLabel: 'TV Shows',
    currentLabel: 'Currently Watching',
    dateField: 'dateStarted',
    startedLabel: 'Date Started',
    dates: [
      { field: 'dateStarted', label: 'Date started' },
      { field: 'dateFinished', label: 'Date finished' }
    ],
    namePlaceholder: 'Season title (e.g. Severance — Season 1)',
    genrePlaceholder: 'e.g. Drama / Comedy',
    tagline: 'Seasons in progress and the episodes you have watched.',
    reviewPlaceholder: 'What did you think of the season?',
    aspect: 'aspect-[2/3]',
    emoji: '📺',
    icon: 'M4 7h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1ZM8 3l4 4 4-4',
    nested: {
      key: 'episodes',
      title: 'Episodes',
      itemLabel: 'Episode',
      addLabel: '+ Add episode',
      nameLabel: 'Episode name',
      dateField: 'dateWatched',
      dateLabel: 'Date watched',
      emptyText: 'No episodes yet. Add the episodes for this season.'
    }
  }
}

// ---------- status definitions ----------
export const STATUS_ORDER = ['current', 'upcoming', 'finished', 'abandoned']

export const STATUS_LABELS = {
  books: {
    current: 'Currently Reading',
    upcoming: 'Upcoming',
    finished: 'Finished',
    abandoned: 'Abandoned'
  },
  games: {
    current: 'Currently Playing',
    upcoming: 'Upcoming',
    finished: 'Finished',
    abandoned: 'Abandoned'
  },
  movies: {
    current: 'Currently Watching',
    upcoming: 'Upcoming',
    finished: 'Finished',
    abandoned: 'Abandoned'
  },
  music: {
    current: 'Currently Listening',
    upcoming: 'Upcoming',
    finished: 'Finished',
    abandoned: 'Abandoned'
  },
  tvshows: {
    current: 'Currently Watching',
    upcoming: 'Upcoming',
    finished: 'Finished',
    abandoned: 'Abandoned'
  }
}

// small dot colors per status (used by section headings and card pills)
export const STATUS_DOT = {
  finished: 'bg-green-500',
  current: 'bg-red-500',
  abandoned: 'bg-slate-400',
  upcoming: 'bg-yellow-500'
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

export async function deleteRecord(type, id) {
  return db[type].delete(id)
}