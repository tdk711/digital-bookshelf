<script>
  import { MEDIA_TYPES } from '../db.js'
  import { useLibraryCounts } from '../store.svelte.js'

  const types = Object.entries(MEDIA_TYPES)
  const library = useLibraryCounts(types.map(([key]) => key))
  const total = $derived(Object.values(library.counts).reduce((sum, n) => sum + (n || 0), 0))
</script>

<div class="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
  <header class="mb-10 sm:mb-12">
    <h1 class="text-4xl sm:text-5xl font-bold leading-[1.08] tracking-tight">Welcome back</h1>
    <p class="mt-3 max-w-xl text-sm sm:text-base text-slate-500 dark:text-slate-400">
      Everything you are reading, watching, playing and listening to — neatly on one shelf.
    </p>
    {#if total > 0}
      <p class="mt-4 inline-flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
        <span class="w-1.5 h-1.5 rounded-full bg-accent"></span>
        {total}
        {total === 1 ? 'title' : 'titles'} in your library
      </p>
    {/if}
  </header>

  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
    {#each types as [key, type]}
      <a
        href="#/{key}"
        class="group relative flex flex-col rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-5 sm:p-6 shadow-sm hover:border-accent/60 hover:shadow-md transition-all"
      >
        <div class="flex items-start justify-between gap-3">
          <span class="grid place-items-center w-11 h-11 rounded-xl bg-accent/10 text-accent">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="1.6" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d={type.icon} />
            </svg>
          </span>
          <span
            class="font-serif text-2xl font-semibold tabular-nums text-slate-300 dark:text-slate-700 group-hover:text-accent/70 transition-colors"
          >
            {library.counts[key] ?? 0}
          </span>
        </div>

        <h2 class="mt-5 font-serif text-lg font-semibold">{type.label}</h2>
        <p class="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
          {type.tagline}
        </p>

        <span class="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-accent">
          Open shelf
          <svg
            class="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5"
            fill="none"
            stroke="currentColor"
            stroke-width="2.2"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 12h14m-6-6 6 6-6 6" />
          </svg>
        </span>
      </a>
    {/each}
  </div>
</div>
