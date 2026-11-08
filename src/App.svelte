<script>
  import { useDarkMode } from './lib/store.svelte.js'
  import Sidebar from './lib/components/Sidebar.svelte'
  import Landing from './lib/components/Landing.svelte'
  import MediaPage from './lib/components/MediaPage.svelte'

  const dark = useDarkMode()

  let hash = $state(location.hash)

  window.addEventListener('hashchange', () => (hash = location.hash))

  const route = $derived.by(() => {
    const h = hash.replace(/^#\/?/, '')
    const seg = h.split('/')[0]
    if (seg === 'games' || seg === 'music') return { media: seg }
    return { media: null }
  })
</script>

<div class="min-h-screen bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-slate-100">
  <Sidebar {dark} />
  <main class="ml-0 md:ml-64 min-h-screen">
    {#if route.media}
      <MediaPage type={route.media} key={route.media} />
    {:else}
      <Landing />
    {/if}
  </main>
</div>
