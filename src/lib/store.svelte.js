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
    error: console.error
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
