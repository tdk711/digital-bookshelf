import Dexie from 'dexie'

// Local-only IndexedDB (no Dexie Cloud)
// Database name stays the same for continuity; version bumped for new tables
export const DB_NAME = 'digital_bookshelf_v2'

export const db = new Dexie(DB_NAME)

// Schema versions
// v1: games, music
// v2: + books
// v3: + movies, tvshows
// v4: + outbox, sync_metadata (for sync client)
db.version(1).stores({
  games: 'id, name, status',
  music: 'id, name, status',
})

db.version(2).stores({
  books: 'id, name, status',
  games: 'id, name, status',
  music: 'id, name, status',
})

db.version(3).stores({
  books: 'id, name, status',
  games: 'id, name, status',
  movies: 'id, name, status',
  music: 'id, name, status',
  tvshows: 'id, name, status',
})

db.version(4).stores({
  books: 'id, name, status',
  games: 'id, name, status',
  movies: 'id, name, status',
  music: 'id, name, status',
  tvshows: 'id, name, status',
  // Sync infrastructure tables
  outbox: '++id, table, recordId, synced_at',
  sync_metadata: 'client_id',
  songs: 'id, album_id, name',
  episodes: 'id, season_id, name',
})

// ---------- media type metadata ----------
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
  books: { current: 'Currently Reading', upcoming: 'Upcoming', finished: 'Finished', abandoned: 'Abandoned' },
  games: { current: 'Currently Playing', upcoming: 'Upcoming', finished: 'Finished', abandoned: 'Abandoned' },
  movies: { current: 'Currently Watching', upcoming: 'Upcoming', finished: 'Finished', abandoned: 'Abandoned' },
  music: { current: 'Currently Listening', upcoming: 'Upcoming', finished: 'Finished', abandoned: 'Abandoned' },
  tvshows: { current: 'Currently Watching', upcoming: 'Upcoming', finished: 'Finished', abandoned: 'Abandoned' }
}

export const STATUS_DOT = {
  finished: 'bg-green-500',
  current: 'bg-red-500',
  abandoned: 'bg-slate-400',
  upcoming: 'bg-yellow-500'
}

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
function plain(obj) {
  return obj === undefined ? obj : JSON.parse(JSON.stringify(obj))
}

import { addToOutbox } from './sync-client.js'

export async function upsertRecord(type, record) {
  const data = plain({ ...record, name: record.name?.trim() || 'Untitled' })
  const now = new Date().toISOString()

  if (data.id) {
    data.dateAdded = data.dateAdded ?? now
    data.dateModified = now
    data.updated_at = now
    await db[type].put(data)
    await addToOutbox(type, 'update', data.id, data)
  } else {
    data.id = crypto.randomUUID()
    data.dateAdded = now
    data.dateModified = now
    data.updated_at = now
    await db[type].add(data)
    await addToOutbox(type, 'insert', data.id, data)
  }
  return data.id
}

export async function deleteRecord(type, id) {
  await db[type].delete(id)
  await addToOutbox(type, 'delete', id, { id })
}

// Helper to get all records of a type (for initial load / debugging)
export async function getAllRecords(type) {
  return db[type].toArray()
}

// Clear all local data (for testing / logout)
export async function clearLocalData() {
  await Promise.all([
    db.books.clear(),
    db.games.clear(),
    db.movies.clear(),
    db.music.clear(),
    db.tvshows.clear(),
    db.songs.clear(),
    db.episodes.clear(),
    db.outbox.clear(),
    db.sync_metadata.clear(),
  ])
}