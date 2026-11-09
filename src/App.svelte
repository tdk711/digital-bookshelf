<script>
  import { db } from './lib/db.js'
  import { useDarkMode } from './lib/store.svelte.js'
  import Sidebar from './lib/components/Sidebar.svelte'
  import Landing from './lib/components/Landing.svelte'
  import MediaPage from './lib/components/MediaPage.svelte'
  import LoginGui from './lib/components/LoginGui.svelte'

  const dark = useDarkMode()

  // gate the whole UI behind sign-in: nothing (landing, pages) renders until
  // the user is authenticated with Dexie Cloud
  let loggedIn = $state(null) // null = unknown yet
  $effect(() => {
    const sub = db.cloud.currentUser.subscribe({
      next: u => (loggedIn = !!u?.isLoggedIn),
      error: () => (loggedIn = false)
    })
    return () => sub.unsubscribe()
  })

  let collapsed = $state(localStorage.getItem('bookshelf:sidebar') === 'collapsed')
  $effect(() => {
    localStorage.setItem('bookshelf:sidebar', collapsed ? 'collapsed' : 'expanded')
  })

  let hash = $state(location.hash)

  window.addEventListener('hashchange', () => (hash = location.hash))

  const route = $derived.by(() => {
    const h = hash.replace(/^#\/?/, '')
    const seg = h.split('/')[0]
    if (seg === 'games' || seg === 'music') return { media: seg }
    return { media: null }
  })
</script>

{#if loggedIn}
  <!-- fixed-height app shell: no page-level scrolling (iOS PWA target); each
       view scrolls inside <main> instead -->
  <div class="h-[100dvh] overflow-hidden bg-slate-100 dark:bg-black text-slate-900 dark:text-slate-100">
    <Sidebar {dark} bind:collapsed />
    <main
      class="ml-0 transition-[margin] duration-200 {collapsed ? 'md:ml-16' : 'md:ml-64'} h-full overflow-y-auto overflow-x-hidden no-scrollbar overscroll-contain pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]"
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
  <!-- splash: shown while checking auth / during login -->
  <div class="h-[100dvh] bg-slate-100 dark:bg-black flex items-center justify-center">
    <div class="flex flex-col items-center gap-4 animate-pulse">
      <svg class="w-12 h-12 text-accent" fill="currentColor" viewBox="0 0 64 64">
        <path d="M8 6h10v52H8zM22 12h10v46H22zM36 6h10v52H36z" opacity="0.9" />
      </svg>
      <p class="text-sm text-slate-400 font-medium">Digital Bookshelf</p>
    </div>
  </div>
{/if}
<LoginGui />
