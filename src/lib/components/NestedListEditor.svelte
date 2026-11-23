<script>
  // Generic embedded-list editor: used for album songs and TV season episodes.
  // Both shapes are { name, rating, <dateField>, status, review }.
  let {
    items = $bindable([]),
    title = 'Items',
    itemLabel = 'Item',
    addLabel = 'Add',
    nameLabel = 'Name',
    dateField = 'dateWatched',
    dateLabel = 'Date',
    emptyText = 'Nothing here yet.',
    statusOptions = []
  } = $props()

  function addItem() {
    items.push({ name: '', rating: '', [dateField]: '', status: 'finished', review: '' })
  }

  function removeItem(i) {
    items.splice(i, 1)
  }
</script>

<div class="rounded-xl border border-slate-200 dark:border-slate-700 p-4">
  <div class="flex items-center justify-between gap-3 mb-3">
    <h3 class="font-serif font-semibold">{title}</h3>
    <button
      onclick={addItem}
      type="button"
      class="text-sm px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 cursor-pointer shrink-0"
    >
      {addLabel}
    </button>
  </div>

  {#if items.length === 0}
    <p class="text-sm text-slate-400 dark:text-slate-500">{emptyText}</p>
  {:else}
    <div class="space-y-3">
      {#each items as item, i}
        <div
          class="grid grid-cols-1 sm:grid-cols-[1fr_90px_150px_130px_auto] gap-2 items-start bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3"
        >
          <label class="block">
            <span class="text-[11px] font-semibold text-slate-400 uppercase">{nameLabel}</span>
            <input type="text" bind:value={item.name} class="w-full input-sm" placeholder="Name" />
          </label>
          <label class="block">
            <span class="text-[11px] font-semibold text-slate-400 uppercase">Rating</span>
            <select bind:value={item.rating} class="w-full input-sm">
              <option value="">—</option>
              {#each Array.from({ length: 21 }, (_, j) => j * 0.5) as r}
                <option value={r}>{r}</option>
              {/each}
            </select>
          </label>
          <label class="block">
            <span class="text-[11px] font-semibold text-slate-400 uppercase">{dateLabel}</span>
            <input type="date" bind:value={item[dateField]} class="w-full input-sm" />
          </label>
          <label class="block">
            <span class="text-[11px] font-semibold text-slate-400 uppercase">Status</span>
            <select bind:value={item.status} class="w-full input-sm">
              {#each statusOptions as [key, label]}
                <option value={key}>{label}</option>
              {/each}
            </select>
          </label>
          <button
            onclick={() => removeItem(i)}
            type="button"
            class="text-sm text-red-600 hover:text-red-700 dark:text-red-400 cursor-pointer self-center justify-self-end"
            aria-label="Remove {itemLabel.toLowerCase()}"
          >
            ✕
          </button>
          <div class="sm:col-span-5">
            <label class="block">
              <span class="text-[11px] font-semibold text-slate-400 uppercase">Review</span>
              <textarea bind:value={item.review} rows="2" class="w-full input-sm resize-y" placeholder="Review"></textarea>
            </label>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  @reference '../../app.css';
  .input-sm {
    @apply rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-black px-2 py-1.5 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-accent/50;
  }
</style>
