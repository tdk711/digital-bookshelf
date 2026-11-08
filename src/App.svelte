<script>
  import { useDarkMode } from './lib/store.svelte.js'
  import Sidebar from './lib/components/Sidebar.svelte'
  import Landing from './lib/components/Landing.svelte'
  import MediaPage from './lib/components/MediaPage.svelte'

  const dark = useDarkMode()

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

<div class="min-h-screen bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-slate-100">
  <Sidebar {dark} bind:collapsed />
  <main class="ml-0 transition-[margin] duration-200 {collapsed ? 'md:ml-16' : 'md:ml-64'} min-h-screen">
    {#if route.media}
      {#key route.media}
        <MediaPage type={route.media} />
      {/key}
    {:else}
      <Landing />
    {/if}
  </main>
</div>
