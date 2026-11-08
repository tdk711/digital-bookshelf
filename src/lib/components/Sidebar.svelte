<script>
  import { MEDIA_TYPES } from '../db.js'

  let { dark, collapsed = $bindable(false) } = $props()

  const types = Object.entries(MEDIA_TYPES)
  const icons = {
    music: 'M9 18V5l12-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm12-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
    games: 'M14.6 6h-5.2A5.4 5.4 0 0 0 4 11.4v.2a4.4 4.4 0 0 0 7.8 2.8l.5-.6h1.4l.5.6A4.4 4.4 0 0 0 20 11.6v-.2A5.4 5.4 0 0 0 14.6 6ZM8 10.5v3M6.5 12h3M14.9 10.8h.01M17.1 12.8h.01'
  }
</script>

<aside
  class="fixed top-0 left-0 z-40 hidden md:flex flex-col h-full border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 transition-[width] duration-200 {collapsed
    ? 'w-16'
    : 'w-64'}"
>
  <div class="flex items-center h-[73px] px-3 border-b border-slate-200 dark:border-slate-700">
    <a href="#/" class="flex items-center gap-2 overflow-hidden" title="Digital Bookshelf">
      <svg class="w-7 h-7 text-accent shrink-0" fill="currentColor" viewBox="0 0 64 64">
        <path d="M8 6h10v52H8zM22 12h10v46H22zM36 6h10v52H36z" opacity="0.9" />
      </svg>
      {#if !collapsed}
        <h1 class="text-lg font-serif font-semibold text-accent whitespace-nowrap">Digital Bookshelf</h1>
      {/if}
    </a>
    <button
      onclick={() => (collapsed = !collapsed)}
      class="ml-auto p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer shrink-0"
      title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d={collapsed ? 'm9 6 6 6-6 6' : 'm15 6-6 6 6 6'} />
      </svg>
    </button>
  </div>

  <nav class="flex-1 px-2 py-6 space-y-1">
    <a
      href="#/"
      class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors {collapsed ? 'justify-center' : ''}"
      title="Home"
    >
      <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M3 11 12 3l9 8M5 10v10h14V10" />
      </svg>
      {#if !collapsed}Home{/if}
    </a>
    {#each types as [key, type]}
      <a
        href="#/{key}"
        class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors {collapsed
          ? 'justify-center'
          : ''}"
        title={type.label}
      >
        <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" stroke-width="1.7" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d={icons[key]} />
        </svg>
        {#if !collapsed}{type.label}{/if}
      </a>
    {/each}
  </nav>

  <div class="px-2 pb-6 pt-4 border-t border-slate-200 dark:border-slate-700 {collapsed ? 'flex justify-center' : 'px-4'}">
    <label class="flex items-center gap-3 cursor-pointer select-none" title="Toggle dark mode">
      <input type="checkbox" checked={dark.dark} onchange={dark.toggle} class="sr-only peer" />
      <!-- switch track -->
      <span
        class="relative inline-flex h-5 w-9 shrink-0 items-center rounded-full bg-slate-300 dark:bg-slate-600 transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-accent peer-checked:bg-accent"
      >
        <!-- knob -->
        <span
          class="absolute h-3.5 w-3.5 left-[3px] rounded-full bg-white shadow transition-transform"
          class:translate-x-4={dark.dark}
        ></span>
      </span>
      {#if !collapsed}
        <span class="text-sm font-medium">{dark.dark ? 'Dark mode' : 'Light mode'}</span>
      {/if}
    </label>
  </div>
</aside>

<!-- mobile top bar with links + switch -->
<div class="md:hidden flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
  <a href="#/" class="text-lg font-serif font-semibold text-accent">Digital Bookshelf</a>
  <nav class="flex items-center gap-2">
    {#each types as [key, type]}
      <a href="#/{key}" class="px-3 py-1.5 text-sm rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">{type.label}</a>
    {/each}
    <label class="flex items-center cursor-pointer select-none gap-2" title="Toggle dark mode">
      <input type="checkbox" checked={dark.dark} onchange={dark.toggle} class="sr-only peer" />
      <span
        class="relative inline-flex h-5 w-9 items-center rounded-full bg-slate-300 dark:bg-slate-600 transition-colors peer-checked:bg-accent"
      >
        <span class="absolute h-3.5 w-3.5 left-[3px] rounded-full bg-white shadow transition-transform" class:translate-x-4={dark.dark}></span>
      </span>
    </label>
  </nav>
</div>
