<script>
  import { MEDIA_TYPES, db } from '../db.js'
  import BrandMark from './BrandMark.svelte'

  // Phones (< md): a permanent 64px icon rail sits at the side; its edge
  // chevron opens a full-height drawer (overlaid) with labels, account row
  // and dark-mode switch. Desktop (md+): the same rail expands to 256px.
  // route = current page key ('' | 'books' | 'games' | 'music') for highlighting
  let { dark, isNarrow = false, collapsed = $bindable(false), route = '' } = $props()

  let drawerOpen = $state(false)

  const types = Object.entries(MEDIA_TYPES)

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

  // shared sizing so the collapsed rail, mobile rail and expanded rail line up
  const railBtn =
    'grid place-items-center w-10 h-10 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer'
  // labels slide/fade instead of popping in and out with the width animation
  const labelCls = on =>
    `overflow-hidden whitespace-nowrap transition-[max-width,opacity,margin] duration-200 ${
      on ? 'max-w-44 opacity-100 ml-3' : 'max-w-0 opacity-0 ml-0'
    }`
</script>

<!-- nav links shared by rail, drawer and expanded rail. labels = show text,
     onNavigate = optional close handler -->
{#snippet navLinks(labels, onNavigate)}
  <a
    href="#/"
    onclick={onNavigate}
    class="flex items-center py-2.5 rounded-lg transition-colors {labels ? 'px-3' : 'pl-3.5 pr-0'} {cls('home')}"
    title="Home"
    aria-label="Home"
    aria-current={activeKey === 'home' ? 'page' : undefined}
  >
    <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" d="M3 11 12 3l9 8M5 10v10h14V10" />
    </svg>
    <span class={labelCls(labels)}>Home</span>
  </a>
  {#each types as [key, type]}
    <a
      href="#/{key}"
      onclick={onNavigate}
      class="flex items-center py-2.5 rounded-lg transition-colors {labels ? 'px-3' : 'pl-3.5 pr-0'} {cls(key)}"
      title={type.label}
      aria-label={type.label}
      aria-current={activeKey === key ? 'page' : undefined}
    >
      <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" stroke-width="1.7" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d={type.icon} />
      </svg>
      <span class={labelCls(labels)}>{type.label}</span>
    </a>
  {/each}
{/snippet}

<!-- compact bottom controls: identical in the mobile rail and the collapsed
     desktop rail, so collapsing never hides the account/dark-mode actions -->
{#snippet accountIcons()}
  <div class="px-2 pb-3 pt-3 border-t border-slate-200 dark:border-slate-700 flex flex-col items-center gap-1">
    {#if user?.email}
      <button
        type="button"
        onclick={() => db.cloud.logout()}
        class={railBtn}
        title="Sign out"
        aria-label="Sign out"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M15 12H3m0 0 4-4m-4 4 4 4M10 5V4a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-9a1 1 0 0 1-1-1v-1"
          />
        </svg>
      </button>
    {:else}
      <button
        type="button"
        onclick={() => db.cloud.login().catch(() => {})}
        class={railBtn}
        title="Sign in"
        aria-label="Sign in"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3"
          />
        </svg>
      </button>
    {/if}
    <button
      type="button"
      onclick={dark.toggle}
      class={railBtn}
      title="Toggle dark mode"
      aria-label="Toggle dark mode"
      aria-pressed={dark.dark}
    >
      {#if dark.dark}
        <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M12 3v1.5M12 19.5V21M4.2 4.2l1.1 1.1M18.7 18.7l1.1 1.1M3 12h1.5M19.5 12H21M4.2 19.8l1.1-1.1M18.7 5.3l1.1-1.1M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z"
          />
        </svg>
      {:else}
        <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"
          />
        </svg>
      {/if}
    </button>
  </div>
{/snippet}

<!-- account row (email + sign out / sign in) + dark mode switch -->
{#snippet accountSection()}
  <div class="px-4 pb-2 pt-4 border-t border-slate-200 dark:border-slate-700 space-y-2">
    {#if user?.email}
      <div class="flex items-center gap-2.5 -mx-1 px-1 pt-1">
        <span class="grid place-items-center w-7 h-7 shrink-0 rounded-full bg-accent/10 text-accent text-xs font-semibold uppercase">
          {user.email[0]}
        </span>
        <div class="min-w-0 flex-1">
          <p class="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Signed in</p>
          <p class="truncate text-xs text-slate-600 dark:text-slate-300" title={user.email}>{user.email}</p>
        </div>
        <button
          onclick={() => db.cloud.logout()}
          class="shrink-0 p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
          title="Sign out"
          aria-label="Sign out"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M15 12H3m0 0 4-4m-4 4 4 4M10 5V4a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-9a1 1 0 0 1-1-1v-1"
            />
          </svg>
        </button>
      </div>
    {:else}
      <div class="-mx-2 px-2">
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
    <div class="flex items-center justify-center h-16 shrink-0 border-b border-slate-200 dark:border-slate-700">
      <a href="#/" title="Digital Bookshelf" aria-label="Digital Bookshelf">
        <BrandMark size="sm" />
      </a>
    </div>
    <nav class="flex-1 px-2 py-6 space-y-1">
      <!-- rail taps navigate directly; only the chevron opens the drawer -->
      {@render navLinks(false)}
    </nav>
    {@render accountIcons()}
    <!-- edge chevron opens the drawer -->
    <button
      onclick={() => (drawerOpen = true)}
      class="absolute -right-3 top-[calc(env(safe-area-inset-top)+18px)] z-50 p-1.5 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-black text-slate-500 dark:text-slate-400 shadow-sm cursor-pointer"
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
      <div class="flex items-center h-16 shrink-0 px-3 border-b border-slate-200 dark:border-slate-700">
        <a href="#/" class="flex items-center overflow-hidden" onclick={() => (drawerOpen = false)} title="Digital Bookshelf">
          <BrandMark size="sm" />
          <span class="ml-2.5 font-serif font-semibold text-accent whitespace-nowrap">Digital Bookshelf</span>
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
        <p class="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">Library</p>
        {@render navLinks(true, () => (drawerOpen = false))}
      </nav>
      {@render accountSection()}
    </aside>
  {/if}
{:else}
  <!-- expandable rail (desktop): same header/nav/bottom geometry as the
       mobile rail when collapsed, labels fade in as the width grows -->
  <aside
    class="fixed top-0 left-0 z-40 flex flex-col h-full pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-black transition-[width] duration-200 ease-out {collapsed
      ? 'w-16'
      : 'w-64'}"
  >
    <div class="flex items-center h-16 shrink-0 border-b border-slate-200 dark:border-slate-700 {collapsed ? 'justify-center' : 'px-3'}">
      <a href="#/" class="flex items-center overflow-hidden" title="Digital Bookshelf">
        <BrandMark size="sm" />
        <h1
          class="font-serif font-semibold text-accent whitespace-nowrap overflow-hidden transition-[max-width,opacity,margin] duration-200 {collapsed
            ? 'max-w-0 opacity-0 ml-0'
            : 'max-w-44 opacity-100 ml-2.5'}"
        >
          Digital Bookshelf
        </h1>
      </a>
    </div>

    <!-- one toggle in one fixed spot, chevron flips with the state -->
    <button
      onclick={() => (collapsed = !collapsed)}
      class="absolute -right-3 top-[calc(env(safe-area-inset-top)+18px)] z-50 p-1.5 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-black text-slate-500 dark:text-slate-400 shadow-sm hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
      title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
    >
      <svg
        class="w-3.5 h-3.5 transition-transform duration-200 {collapsed ? '' : 'rotate-180'}"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        viewBox="0 0 24 24"
      >
        <path stroke-linecap="round" stroke-linejoin="round" d="m9 6 6 6-6 6" />
      </svg>
    </button>

    <div class="px-2 pt-6">
      <p
        class="px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500 overflow-hidden whitespace-nowrap transition-[max-height,opacity,padding] duration-200 {collapsed
          ? 'max-h-0 opacity-0 pb-0'
          : 'max-h-8 opacity-100 pb-2'}"
      >
        Library
      </p>
    </div>
    <nav class="flex-1 px-2 pb-6 space-y-1">
      {@render navLinks(!collapsed)}
    </nav>

    {#if collapsed}
      {@render accountIcons()}
    {:else}
      {@render accountSection()}
    {/if}
  </aside>
{/if}
