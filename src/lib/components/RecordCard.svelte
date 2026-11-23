<script>
  import { MEDIA_TYPES, STATUS_LABELS, STATUS_DOT } from '../db.js'

  let { record, type, onclick } = $props()

  const meta = $derived(MEDIA_TYPES[type])
  // cover proportions differ by medium (album art is square, posters are 2:3)
  const aspect = $derived(meta.aspect)
</script>

<button
  {onclick}
  class="group text-left w-full cursor-pointer rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-slate-100 dark:focus-visible:ring-offset-black"
>
  <div
    class="relative overflow-hidden rounded-xl bg-slate-200 dark:bg-slate-800 shadow-sm ring-1 ring-black/5 dark:ring-white/10 transition-shadow group-hover:shadow-lg {aspect}"
  >
    {#if record.imageUrl}
      <img
        src={record.imageUrl}
        alt={record.name}
        class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
        loading="lazy"
      />
    {:else}
      <div class="w-full h-full flex items-center justify-center text-4xl opacity-60">
        {meta.emoji}
      </div>
    {/if}

    <!-- status pill -->
    <span
      class="absolute top-2 left-2 max-w-[calc(100%-1rem)] inline-flex items-center gap-1.5 rounded-full bg-white/90 dark:bg-black/75 backdrop-blur px-2 py-0.5 text-[10px] font-semibold text-slate-700 dark:text-slate-200 shadow-sm"
    >
      <span class="w-1.5 h-1.5 shrink-0 rounded-full {STATUS_DOT[record.status] ?? 'bg-slate-400'}"></span>
      <span class="truncate">{STATUS_LABELS[type][record.status] ?? record.status}</span>
    </span>

    <!-- rating -->
    {#if record.rating}
      <span
        class="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-full bg-black/65 text-white px-2 py-0.5 text-[11px] font-semibold backdrop-blur"
      >
        <svg class="w-3 h-3 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
          <path d="m12 2 2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.4 5.9 20.6l1.4-6.8L2.2 9.1l6.9-.8L12 2Z" />
        </svg>
        {record.rating}
      </span>
    {/if}
  </div>

  <div class="pt-2 px-0.5">
    <p class="font-serif font-medium text-sm leading-snug line-clamp-2">{record.name}</p>
    {#if record.genre}
      <p class="mt-0.5 text-xs text-slate-500 dark:text-slate-400 truncate">{record.genre}</p>
    {/if}
  </div>
</button>
