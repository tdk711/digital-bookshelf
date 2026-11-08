<script>
  import { MEDIA_TYPES } from '../db.js'

  const types = Object.entries(MEDIA_TYPES)
  const icons = {
    music: 'M9 18V5l12-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm12-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
    games: 'M14.6 6h-5.2A5.4 5.4 0 0 0 4 11.4v.2a4.4 4.4 0 0 0 7.8 2.8l.5-.6h1.4l.5.6A4.4 4.4 0 0 0 20 11.6v-.2A5.4 5.4 0 0 0 14.6 6ZM8 10.5v3M6.5 12h3M14.9 10.8h.01M17.1 12.8h.01'
  }
</script>

<div class="max-w-4xl mx-auto px-6 py-12">
  <h1 class="text-3xl font-bold mb-2">Welcome to your Bookshelf</h1>
  <p class="text-slate-500 dark:text-slate-400 mb-10">Pick a section to start cataloging.</p>
  <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
    {#each types as [key, type]}
      <a
        href="#/{key}"
        class="group flex flex-col items-center justify-center gap-6 p-10 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm hover:shadow-md hover:border-accent transition-all"
      >
        <svg
          class="w-16 h-16 text-accent"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d={icons[key]} />
        </svg>
        <span class="text-xl font-serif font-medium">{type.label}</span>
      </a>
    {/each}
  </div>
</div>
