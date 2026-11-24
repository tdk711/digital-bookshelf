// Svelte 5 store module: local IndexedDB queries as reactive runes
// No more Dexie Cloud liveQuery - we use manual sync via sync-client
import { db, partitionRecords } from './db.js'
import { onSyncStatus } from './sync-client.js'

// Cache for live query subscriptions
const queryCache = new Map()

export function useRecords(type) {
  let items = $state([])
  let loading = $state(true)
  let sections = $derived(partitionRecords(items, type))

  // Initial load
  loadRecords()

  // Subscribe to sync status to refresh when sync completes
  const unsubscribeSync = onSyncStatus(status => {
    if (!status.isSyncing && status.lastSync) {
      loadRecords()
    }
  })

  async function loadRecords() {
    try {
      loading = true
      const list = await db[type].toArray()
      items = $state.snapshot(list)
      loading = false
    } catch (err) {
      console.error(`Failed to load ${type}:`, err)
      loading = false
    }
  }

  $effect(() => () => unsubscribeSync())

  return {
    get items() { return items },
    get loading() { return loading },
    get current() { return sections.current },
    get upcoming() { return sections.upcoming },
    get finished() { return sections.finished },
    refresh: loadRecords,
  }
}

// counts for the landing page tiles
export function useLibraryCounts(types) {
  let counts = $state({})
  let loading = $state(true)

  async function loadCounts() {
    try {
      loading = true
      const entries = await Promise.all(
        types.map(async type => {
          try {
            return [type, await db[type].count()]
          } catch {
            return [type, 0]
          }
        })
      )
      counts = Object.fromEntries(entries)
      loading = false
    } catch {
      loading = false
    }
  }

  // Initial load
  loadCounts()

  // Refresh on sync
  const unsubscribeSync = onSyncStatus(status => {
    if (!status.isSyncing && status.lastSync) {
      loadCounts()
    }
  })

  $effect(() => () => unsubscribeSync())

  return {
    get counts() { return counts },
    get loading() { return loading },
    refresh: loadCounts,
  }
}

// dark mode: persisted in localStorage, applied as class on <html>
export function useDarkMode() {
  let dark = $state(localStorage.getItem('bookshelf:dark') === '1')

  $effect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('bookshelf:dark', dark ? '1' : '0')
  })

  return {
    get dark() { return dark },
    toggle: () => (dark = !dark)
  }
}