<script>
  import { STATUS_LABELS, STATUS_COLOR } from '../db.js'

  let { record, type, onclick } = $props()
</script>

<button
  {onclick}
  class="text-left w-full rounded-xl overflow-hidden bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md cursor-pointer transition-all"
>
  <div class="aspect-[3/4] w-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
    {#if record.imageUrl}
      <img src={record.imageUrl} alt={record.name} class="w-full h-full object-cover" loading="lazy" />
    {:else}
      <div class="w-full h-full flex items-center justify-center text-4xl text-slate-400">
        {type === 'games' ? '🎮' : '🎵'}
      </div>
    {/if}
  </div>
  <div class="p-3 flex items-center justify-between gap-2">
    <span class="font-serif font-medium text-sm leading-tight line-clamp-2">{record.name}</span>
    {#if record.rating}
      <span class="text-xs font-semibold text-accent shrink-0">★ {record.rating}</span>
    {/if}
  </div>
  <div class="px-3 pb-3">
    <span
      class="inline-block px-2 py-0.5 rounded text-[11px] font-semibold {STATUS_COLOR[record.status]}"
    >
      {STATUS_LABELS[type][record.status]}
    </span>
  </div>
</button>
