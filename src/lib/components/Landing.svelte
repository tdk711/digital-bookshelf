<script>
  import { MEDIA_TYPES } from '../db.js'

  const types = Object.entries(MEDIA_TYPES)
  const icons = {
    music: 'M9 18V5l12-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm12-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
    games: 'M7.8 7h8.4a4.8 4.8 0 0 1 4.77 4.3l.33 3.13A3.6 3.6 0 0 1 14.9 17.4l-.9-.9a1.5 1.5 0 0 0-1.06-.44h-1.88a1.5 1.5 0 0 0-1.06.44l-.9.9a3.6 3.6 0 0 1-6.4-2.97l.33-3.13A4.8 4.8 0 0 1 7.8 7ZM7.5 10.5v4M5.5 12.5h4M16.2 11h.01M17.4 13.2h.01'
  }
</script>

<div class="max-w-4xl mx-auto px-6 py-12">
  <h1 class="text-3xl font-bold mb-2">Welcome to your Bookshelf</h1>
  <p class="text-slate-500 dark:text-slate-400 mb-10">Pick a section to start cataloging.</p>
  <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
    {#each types as [key, type]}
      <a
        href="#/{key}"
        class="group flex flex-col items-center justify-center gap-6 p-10 bg-white dark:bg-black border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm hover:shadow-md hover:border-accent transition-all"
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
