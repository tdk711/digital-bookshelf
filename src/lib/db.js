import Dexie from 'dexie'

export const db = new Dexie('digital_bookshelf')

db.version(1).stores({
  games: '++id, name, status',
  music: '++id, name, status'
})

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

// dateAdded is set automatically on first save; never user-editable
export async function upsertRecord(type, record) {
  const data = plain({ ...record, name: record.name?.trim() || 'Untitled' })
  const now = new Date().toISOString()
  if (record.id) {
    data.dateAdded = data.dateAdded ?? now
    data.dateModified = now
    return db[type].put(data)
  }
  delete data.id
  data.dateAdded = now
  data.dateModified = now
  return db[type].add(data)
}

export async function deleteRecord(type, id) {
  return db[type].delete(id)
}
