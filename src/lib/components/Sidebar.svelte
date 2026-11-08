<script>
  import { MEDIA_TYPES } from '../db.js'

  let { dark } = $props()

  const types = Object.entries(MEDIA_TYPES)
  const icons = {
    music: 'M9 18V5l12-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm12-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
    games: 'M11 5H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h5m0-14h7a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-7m0-14v14'
  }
</script>

<aside
  class="fixed top-0 left-0 z-40 hidden md:flex flex-col w-64 h-full border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
>
  <a href="#/" class="px-6 py-6 border-b border-slate-200 dark:border-slate-700">
    <h1 class="text-xl font-serif font-semibold text-accent">Digital Bookshelf</h1>
  </a>
  <nav class="flex-1 px-4 py-6 space-y-1">
    <a
      href="#/"
      class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
    >
      <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M3 11 12 3l9 8M5 10v10h14V10" />
      </svg>
      Home
    </a>
    {#each types as [key, type]} <a
        href="#/{key}"
        class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.7" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d={icons[key]} />
        </svg>
        {type.label}
      </a>
    {/each}
  </nav>
  <div class="px-4 pb-6 border-t border-slate-200 dark:border-slate-700 pt-4">
    <button
      onclick={dark.toggle}
      class="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 transition-colors cursor-pointer"
    >
      {#if dark.dark}
        <!-- moon/sun -->
        <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M12 3v2m0 14v2m9-9h-2M5 12H3m15.36 6.36-1.42-1.42M7.05 7.05 5.64 5.64m12.72 0-1.42 1.42M7.05 16.95l-1.41 1.41M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z"
          />
        </svg>
        Light mode
      {:else}
        <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z"
          />
        </svg>
        Dark mode
      {/if}
    </button>
  </div>
</aside>

<!-- mobile top bar with links -->
<div class="md:hidden flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
  <a href="#/" class="text-lg font-serif font-semibold text-accent">Digital Bookshelf</a>
  <nav class="flex items-center gap-2">
    {#each types as [key, type]}
      <a href="#/{key}" class="px-3 py-1.5 text-sm rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">{type.label}</a>
    {/each}
    <button onclick={dark.toggle} aria-label="Toggle dark mode" class="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer">
      {#if dark.dark}☀{:else}🌙{/if}
    </button>
  </nav>
</div>
