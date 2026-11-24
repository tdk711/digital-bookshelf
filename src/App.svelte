<script>
  import { db, MEDIA_TYPES } from './lib/db.js'
  import { useDarkMode } from './lib/store.svelte.js'
  import Sidebar from './lib/components/Sidebar.svelte'
  import Landing from './lib/components/Landing.svelte'
  import MediaPage from './lib/components/MediaPage.svelte'
  import PinEntry from './lib/components/PinEntry.svelte'
  import BrandMark from './lib/components/BrandMark.svelte'
  import { onAuthChange, isUnlocked, lock } from './lib/pin-auth.js'

  const dark = useDarkMode()

  // App lock state managed by PIN auth
  let unlocked = $state(isUnlocked())
  let pendingRoute = $state(null)

  onAuthChange(state => {
    unlocked = !state.isLocked
    if (unlocked && pendingRoute) {
      location.hash = pendingRoute
      pendingRoute = null
    }
  })

  // Handle hash routing
  let hash = $state(location.hash)
  window.addEventListener('hashchange', () => (hash = location.hash))

  const route = $derived.by(() => {
    if (!unlocked) return { media: null }
    const h = hash.replace(/^#\/?/, '')
    const seg = h.split('/')[0]
    if (seg && seg in MEDIA_TYPES) return { media: seg }
    return { media: null }
  })

  let collapsed = $state(localStorage.getItem('bookshelf:sidebar') === 'collapsed')
  $effect(() => {
    localStorage.setItem('bookshelf:sidebar', collapsed ? 'collapsed' : 'expanded')
  })

  let isNarrow = $state(window.matchMedia('(max-width: 767px)').matches)
  $effect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const onChange = e => (isNarrow = e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  })

  // Handle logout from sidebar
  function handleLogout() {
    lock()
    location.hash = '#/'
  }
</script>

{#if unlocked}
  <!-- fixed-height app shell: no page-level scrolling (iOS PWA target); each
       view scrolls inside <main> instead -->
  <div class="h-[100dvh] overflow-hidden app-bg bg-slate-100 dark:bg-black text-slate-900 dark:text-slate-100">
    <Sidebar {dark} {isNarrow} {collapsed} route={route.media ?? ''} onLogout={handleLogout} />
    <main
      class="ml-16 transition-[margin] duration-200 {collapsed ? 'md:ml-16' : 'md:ml-64'} h-full overflow-y-auto overflow-x-hidden no-scrollbar overscroll-contain pt-[env(safe-area-inset-top)] pb-[calc(env(safe-area-inset-bottom)+1rem)]"
    >
      {#if route.media}
        {#key route.media}
          <MediaPage type={route.media} />
        {/key}
      {:else}
        <Landing />
      {/if}
    </main>
  </div>
{:else}
  <!-- PIN entry screen -->
  <PinEntry onUnlock={() => { unlocked = true }} />
{/if}