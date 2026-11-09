<script>
  import { MEDIA_TYPES, db } from '../db.js'

  // Phones (< md): a permanent 64px icon rail sits at the side; its edge
  // chevron opens a full-height drawer (overlaid) with labels, account row
  // and dark-mode switch. Desktop (md+): the expandable rail as before.
  // route = current page key ('' | 'music' | 'games') for the active highlight
  let { dark, isNarrow = false, collapsed = $bindable(false), route = '' } = $props()

  let drawerOpen = $state(false)

  const types = Object.entries(MEDIA_TYPES)
  const icons = {
    music: 'M9 18V5l12-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm12-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
    games: 'M7.8 7h8.4a4.8 4.8 0 0 1 4.77 4.3l.33 3.13A3.6 3.6 0 0 1 14.9 17.4l-.9-.9a1.5 1.5 0 0 0-1.06-.44h-1.88a1.5 1.5 0 0 0-1.06.44l-.9.9a3.6 3.6 0 0 1-6.4-2.97l.33-3.13A4.8 4.8 0 0 1 7.8 7ZM7.5 10.5v4M5.5 12.5h4M16.2 11h.01M17.4 13.2h.01'
  }

  let user = $state(null)
  $effect(() => {
    const sub = db.cloud.currentUser.subscribe({
      next: u => (user = u && u.userId ? u : null),
      error: () => {}
    })
    return () => sub.unsubscribe()
  })

  // active-page highlighting: subtle accent bg + accent text on the current route
  const activeKey = $derived(route || 'home')
  const cls = key =>
    activeKey === key
      ? 'bg-accent/10 text-accent font-semibold'
      : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-inherit'

</script>

<!-- nav links shared by rail, drawer and desktop rail (labels = show text,
     onNavigate = optional close handler) -->
{#snippet navLinks(labels, onNavigate)}
    <a
      href="#/"
      onclick={onNavigate}
      class="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors {!labels ? 'justify-center' : ''} {cls('home')}"
      title="Home"
      aria-label="Home"
      aria-current={activeKey === 'home' ? 'page' : undefined}
    >
      <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M3 11 12 3l9 8M5 10v10h14V10" />
      </svg>
      {#if labels}Home{/if}
    </a>
    {#each types as [key, type]}
      <a
        href="#/{key}"
        onclick={onNavigate}
        class="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors {!labels ? 'justify-center' : ''} {cls(key)}"
        title={type.label}
        aria-label={type.label}
        aria-current={activeKey === key ? 'page' : undefined}
      >
        <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" stroke-width="1.7" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d={icons[key]} />
        </svg>
        {#if labels}{type.label}{/if}
      </a>
    {/each}
  {/snippet}

<!-- account row (email + sign out / sign in) + dark mode switch -->
{#snippet accountSection()}
    <div class="px-4 pb-2 pt-4 border-t border-slate-200 dark:border-slate-700 space-y-3">
      {#if user?.email}
        <div class="flex items-center justify-between gap-2 -mx-2 px-2 pt-3 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400">
          <span class="truncate" title={user.email}>{user.email}</span>
          <button
            onclick={() => db.cloud.logout()}
            class="shrink-0 inline-flex items-center gap-1.5 px-2 py-1.5 -my-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
            title="Sign out"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M15 12H3m0 0 4-4m-4 4 4 4M10 5V4a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-9a1 1 0 0 1-1-1v-1"
              />
            </svg>
            Sign out
          </button>
        </div>
      {:else}
        <div class="-mx-2 px-2 pt-3 border-t border-slate-200 dark:border-slate-700">
          <button
            onclick={() => db.cloud.login().catch(() => {})}
            class="flex w-full items-center gap-3 px-2 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3"
              />
            </svg>
            Sign in
          </button>
        </div>
      {/if}
      <label
        class="flex items-center gap-3 cursor-pointer select-none -mx-2 px-2 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        title="Toggle dark mode"
      >
        <input type="checkbox" checked={dark.dark} onchange={dark.toggle} class="sr-only peer" />
        <span
          class="relative inline-flex h-5 w-9 shrink-0 items-center rounded-full bg-slate-300 dark:bg-slate-600 transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-accent peer-checked:bg-accent"
        >
          <span
            class="absolute h-3.5 w-3.5 left-[3px] rounded-full bg-white shadow transition-transform"
            class:translate-x-4={dark.dark}
          ></span>
        </span>
        <span class="text-sm font-medium">Dark mode</span>
      </label>
    </div>
  {/snippet}

{#if isNarrow}
  <!-- permanent icon rail (mobile) -->
  <aside
    class="fixed top-0 left-0 z-40 flex flex-col h-full w-16 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-black"
  >
    <div class="flex items-center justify-center h-[64px] shrink-0 border-b border-slate-200 dark:border-slate-700">
      <a href="#/" title="Digital Bookshelf" aria-label="Digital Bookshelf">
        <svg class="w-6 h-6 text-accent" fill="currentColor" viewBox="0 0 64 64">
          <path d="M8 6h10v52H8zM22 12h10v46H22zM36 6h10v52H36z" opacity="0.9" />
        </svg>
      </a>
    </div>
    <nav class="flex-1 px-2 py-6 space-y-1">
      <!-- rail taps navigate directly; only the chevron opens the drawer -->
      {@render navLinks(false)}
    </nav>
    <!-- edge chevron opens the drawer -->
    <button
      onclick={() => (drawerOpen = true)}
      class="absolute -right-3 top-[calc(env(safe-area-inset-top)+20px)] z-50 p-1 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-black text-slate-500 dark:text-slate-400 shadow-sm cursor-pointer"
      title="Open menu"
      aria-label="Open menu"
    >
      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="m9 6 6 6-6 6" />
      </svg>
    </button>
  </aside>

  {#if drawerOpen}
    <!-- mobile drawer: overlays the page, keeps main content width unchanged -->
    <button
      class="fixed inset-0 z-40 bg-black/50 cursor-default"
      onclick={() => (drawerOpen = false)}
      aria-label="Close menu"
    ></button>
    <aside
      class="fixed top-0 left-0 z-50 flex flex-col h-full w-64 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-black shadow-2xl"
    >
      <div class="flex items-center h-[64px] shrink-0 px-3 border-b border-slate-200 dark:border-slate-700">
        <a href="#/" class="flex items-center gap-2 overflow-hidden" onclick={() => (drawerOpen = false)} title="Digital Bookshelf">
          <svg class="w-7 h-7 text-accent shrink-0" fill="currentColor" viewBox="0 0 64 64">
            <path d="M8 6h10v52H8zM22 12h10v46H22zM36 6h10v52H36z" opacity="0.9" />
          </svg>
        </a>
        <button
          onclick={() => (drawerOpen = false)}
          class="ml-auto p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer shrink-0"
          title="Close menu"
          aria-label="Close menu"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="m15 6-6 6 6 6" />
          </svg>
        </button>
      </div>
      <nav class="flex-1 px-2 py-6 space-y-1">
        {@render navLinks(true, () => (drawerOpen = false))}
      </nav>
      {@render accountSection()}
    </aside>
  {/if}
{:else}
  <!-- expandable rail (desktop) -->
  <aside
    class="fixed top-0 left-0 z-40 flex flex-col h-full pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-black transition-[width] duration-200 {collapsed
      ? 'w-16'
      : 'w-64'}"
  >
    <div class="flex items-center h-[73px] shrink-0 border-b border-slate-200 dark:border-slate-700 {collapsed ? 'justify-center' : 'px-3'}">
      <a href="#/" class="flex items-center {collapsed ? '' : 'gap-2 overflow-hidden'}" title="Digital Bookshelf">
        <svg class="{collapsed ? 'w-6 h-6' : 'w-7 h-7'} text-accent shrink-0" fill="currentColor" viewBox="0 0 64 64">
          <path d="M8 6h10v52H8zM22 12h10v46H22zM36 6h10v52H36z" opacity="0.9" />
        </svg>
        {#if !collapsed}
          <h1 class="text-lg font-serif font-semibold text-accent whitespace-nowrap">Digital Bookshelf</h1>
        {/if}
      </a>
      {#if collapsed}
        <!-- floating on the sidebar edge so the logo stays centered -->
        <button
          onclick={() => (collapsed = false)}
          class="absolute -right-3 top-[24px] z-50 p-1 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-black text-slate-500 dark:text-slate-400 shadow-sm hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
          title="Expand sidebar"
          aria-label="Expand sidebar"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="m9 6 6 6-6 6" />
          </svg>
        </button>
      {:else}
        <button
          onclick={() => (collapsed = true)}
          class="ml-auto p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer shrink-0"
          title="Collapse sidebar"
          aria-label="Collapse sidebar"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="m15 6-6 6 6 6" />
          </svg>
        </button>
      {/if}
    </div>
    <nav class="flex-1 px-2 py-6 space-y-1">
      {@render navLinks(!collapsed)}
    </nav>
    {#if !collapsed}
      {@render accountSection()}
    {/if}
  </aside>
{/if}
