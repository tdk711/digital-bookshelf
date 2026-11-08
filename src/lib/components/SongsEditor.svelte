<script>
  let { songs } = $props()

  function addSong() {
    songs.push({ name: '', rating: '', dateListened: '', status: 'finished', review: '' })
  }
  function removeSong(i) {
    songs.splice(i, 1)
  }
</script>

<div class="rounded-xl border border-slate-200 dark:border-slate-700 p-4">
  <div class="flex items-center justify-between mb-3">
    <h3 class="font-serif font-semibold">Songs</h3>
    <button
      onclick={addSong}
      type="button"
      class="text-sm px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 cursor-pointer"
    >
      + Add song
    </button>
  </div>

  {#if songs.length === 0}
    <p class="text-sm text-slate-400">No songs yet. Add songs for this album.</p>
  {:else}
    <div class="space-y-3">
      {#each songs as song, i}
        <div class="grid grid-cols-1 sm:grid-cols-[1fr,90px,150px,130px,auto] gap-2 items-start bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3">
          <label class="block">
            <span class="text-[11px] font-semibold text-slate-400 uppercase">Song name</span>
            <input type="text" bind:value={song.name} class="w-full input-sm" placeholder="Name" />
          </label>
          <label class="block">
            <span class="text-[11px] font-semibold text-slate-400 uppercase">Rating</span>
            <select bind:value={song.rating} class="w-full input-sm">
              <option value="">—</option>
              {#each Array.from({ length: 21 }, (_, j) => j * 0.5) as r}
                <option value={r}>{r}</option>
              {/each}
            </select>
          </label>
          <label class="block">
            <span class="text-[11px] font-semibold text-slate-400 uppercase">Date listened</span>
            <input type="date" bind:value={song.dateListened} class="w-full input-sm" />
          </label>
          <label class="block">
            <span class="text-[11px] font-semibold text-slate-400 uppercase">Status</span>
            <select bind:value={song.status} class="w-full input-sm">
              <option value="current">Currently Listening</option>
              <option value="finished">Finished</option>
              <option value="abandoned">Abandoned</option>
              <option value="upcoming">Upcoming</option>
            </select>
          </label>
          <button
            onclick={() => removeSong(i)}
            type="button"
            class="text-sm text-red-600 hover:text-red-700 cursor-pointer self-center justify-self-end"
            aria-label="Remove song"
          >
            ✕
          </button>
          <div class="sm:col-span-5">
            <label class="block">
              <span class="text-[11px] font-semibold text-slate-400 uppercase">Review</span>
              <textarea bind:value={song.review} rows="2" class="w-full input-sm resize-y" placeholder="Review"></textarea>
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
    @apply rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50;
  }
</style>
