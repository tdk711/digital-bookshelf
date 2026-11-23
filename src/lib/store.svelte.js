// Svelte 5 store module: live IndexedDB queries as reactive runes
import { liveQuery } from 'dexie'
import { db, partitionRecords } from './db.js'

export function useRecords(type) {
  let items = $state([])
  let loading = $state(true)
  let sections = $derived(partitionRecords(items, type))

  const sub = liveQuery(() => db[type].toArray()).subscribe({
    next: list => {
      items = $state.snapshot(list)
      loading = false
    },
    error: err => {
      // never leave the shelf stuck on its skeleton (e.g. auth/permission
      // errors before the first sync): fall through to the empty states
      console.error(err)
      loading = false
    }
  })

  $effect(() => () => sub.unsubscribe())

  return {
    get items() { return items },
    get loading() { return loading },
    get current() { return sections.current },
    get upcoming() { return sections.upcoming },
    get finished() { return sections.finished }
  }
}

// counts for the landing page tiles. Live-queried like the shelves; failures
// (e.g. the auth-gated dev frame) resolve to zero so the page still renders.
export function useLibraryCounts(types) {
  let counts = $state({})

  const sub = liveQuery(async () => {
    const entries = await Promise.all(
      types.map(async type => {
        try {
          return [type, await db[type].count()]
        } catch {
          return [type, 0]
        }
      })
    )
    return Object.fromEntries(entries)
  }).subscribe({
    next: next => (counts = next),
    error: () => {}
  })

  $effect(() => () => sub.unsubscribe())

  return {
    get counts() {
      return counts
    }
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
