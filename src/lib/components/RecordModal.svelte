<script>
  import { untrack } from 'svelte'
  import { MEDIA_TYPES, STATUS_LABELS, upsertRecord, deleteRecord } from '../db.js'
  import SongsEditor from './SongsEditor.svelte'

  let { type, record, onsave, onclose } = $props()

  // intentionally a one-time copy: the modal is remounted ({#key}) for each
  // opened record, so values are captured once at creation
  const isNew = untrack(() => !record.id)
  const draft = $state(untrack(() => ($state.snapshot(record))))

  // songs editing only applies to albums
  const songs = $state(
    untrack(() => (type === 'music' ? ($state.snapshot(record).songs ?? []) : []))
  )

  async function handleSaveAndClose() {
    if (draft.id) {
      // existing record: save with current songs
      await upsertRecord(type, { ...draft, songs })
    } else {
      const id = await upsertRecord(type, draft)
      if (type === 'music' && songs.length > 0) {
        await upsertRecord(type, { ...draft, id, songs })
      }
    }
    onsave(draft)
  }

  // optical helper: track image URL to preview
  const imgUrl = $derived(draft.imageUrl?.trim())
  const imgLoaded = $state({ ok: false, error: false })
  $effect(() => {
    imgLoaded.ok = false
    imgLoaded.error = false
    if (!imgUrl) imgLoaded.error = true
  })

  async function handleDelete() {
    await deleteRecord(type, draft.id)
    onclose()
  }
</script>

<div class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
  <div class="bg-white dark:bg-slate-800 w-full max-w-3xl max-h-[90vh] rounded-2xl flex flex-col overflow-hidden shadow-xl">
    <header class="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
      <h2 class="text-xl font-serif font-semibold">
        {isNew ? 'New Record' : 'Edit Record'}
      </h2>
      <button
        onclick={onclose}
        class="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
        aria-label="Close"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="m6 6 12 12M6 18 18 6" />
        </svg>
      </button>
    </header>

    <form onsubmit={e => { e.preventDefault(); handleSaveAndClose() }} class="flex-1 overflow-y-auto">
      <div class="p-6 grid grid-cols-1 md:grid-cols-[200px,1fr] gap-6">
        <!-- Image, fetched from the link; top-left -->
        <div class="space-y-3">
          <div class="aspect-[3/4] w-full rounded-lg bg-slate-200 dark:bg-slate-700 overflow-hidden">
            {#if imgUrl && !imgLoaded.error}
              <img
                src={imgUrl}
                alt={draft.name}
                class="w-full h-full object-cover"
                onload={() => (imgLoaded.ok = true)}
                onerror={() => (imgLoaded.error = true)}
              />
            {:else}
              <div class="w-full h-full flex items-center justify-center text-4xl text-slate-400">
                {type === 'games' ? '🎮' : '🎵'}
              </div>
            {/if}
          </div>
          <label class="block">
            <span class="label">Image URL</span>
            <input type="url" bind:value={draft.imageUrl} placeholder="https://…" class="w-full input" />
          </label>
        </div>

        <!-- Fields, top-right -->
        <div class="space-y-4">
          <label class="block">
            <span class="label">Name</span>
            <input type="text" bind:value={draft.name} required class="w-full input" placeholder={type === 'games' ? 'Game title' : 'Album title'} />
          </label>

          <label class="block">
            <span class="label">Status</span>
            <select bind:value={draft.status} class="w-full input">
              {#each Object.entries(STATUS_LABELS[type]) as [key, label]}
                <option value={key}>{label}</option>
              {/each}
            </select>
          </label>

          <label class="block">
            <span class="label">Genre</span>
            <input type="text" bind:value={draft.genre} class="w-full input" placeholder="e.g. RPG / Jazz" />
          </label>

          <label class="block">
            <span class="label">Rating</span>
            <select bind:value={draft.rating} class="w-full input">
              <option value="">—</option>
              {#each Array.from({ length: 21 }, (_, i) => i * 0.5) as r}
                <option value={r}>{r}</option>
              {/each}
            </select>
          </label>

          {#if type === 'games'}
            <label class="block">
              <span class="label">Platform</span>
              <select bind:value={draft.platform} class="w-full input">
                <option value="">—</option>
                <option value="mobile">Mobile</option>
                <option value="ps4">PS4</option>
                <option value="pc">PC</option>
              </select>
            </label>
            <label class="block">
              <span class="label">Date started</span>
              <input type="date" bind:value={draft.dateStarted} class="w-full input" />
            </label>
            <label class="block">
              <span class="label">Date finished</span>
              <input type="date" bind:value={draft.dateFinished} class="w-full input" />
            </label>
          {:else}
            <label class="block">
              <span class="label">Artist</span>
              <input type="text" bind:value={draft.artist} class="w-full input" placeholder="Artist / band" />
            </label>
            <label class="block">
              <span class="label">Date listened</span>
              <input type="date" bind:value={draft.dateListened} class="w-full input" />
            </label>
          {/if}
        </div>

        <!-- Review + songs, full width -->
        <div class="md:col-span-2 space-y-6">
          {#if type === 'music'}
            <SongsEditor {songs} />
          {/if}
          <label class="block">
            <span class="label">Review</span>
            <textarea
              bind:value={draft.review}
              rows="6"
              class="w-full input resize-y"
              placeholder="Write your thoughts…"
            ></textarea>
          </label>
        </div>
      </div>
    </form>

    <footer class="flex items-center justify-between gap-4 px-6 py-4 border-t border-slate-200 dark:border-slate-700">
      {#if !isNew}
        <button
          onclick={handleDelete}
          class="text-sm text-red-600 hover:text-red-700 dark:text-red-400 cursor-pointer"
        >
          Delete record
        </button>
      {:else}
        <span></span>
      {/if}
      <div class="flex gap-3">
        <button
          onclick={onclose}
          type="button"
          class="px-4 py-2 rounded-lg text-sm font-medium border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
        >
          Discard changes and close
        </button>
        <button
          onclick={handleSaveAndClose}
          type="button"
          class="px-4 py-2 rounded-lg text-sm font-medium bg-accent hover:bg-accent-dark text-white cursor-pointer"
        >
          Save and close
        </button>
      </div>
    </footer>
  </div>
</div>

<style>
  @reference '../../app.css';
  .label {
    @apply text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1 block;
  }
  .input {
    @apply rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent;
  }
</style>
