<script>
  import { untrack } from 'svelte'
  import { MEDIA_TYPES, STATUS_LABELS, upsertRecord, deleteRecord } from '../db.js'
  import SongsEditor from './SongsEditor.svelte'

  let { type, record, onsave, onclose } = $props()

  // intentionally a one-time copy: the modal is remounted ({#key}) for each
  // opened record, so values are captured once at creation
  const isNew = untrack(() => !record.id)
  const draft = $state(untrack(() => ($state.snapshot(record))))
  const meta = $derived(MEDIA_TYPES[type])
  // cover proportions per medium (see RecordCard)
  const aspect = $derived(
    type === 'music' ? 'aspect-square' : type === 'books' ? 'aspect-[2/3]' : 'aspect-[3/4]'
  )

  // songs editing only applies to albums
  const songs = $state(
    untrack(() => (type === 'music' ? ($state.snapshot(record).songs ?? []) : []))
  )

  // iOS keyboards pan the whole (fixed) layer up — the visible band is
  // [visualViewport.offsetTop, +height]; keep the dialog inside that band.
  let vvHeight = $state(window.innerHeight)
  let vvOffsetTop = $state(0)
  $effect(() => {
    const vv = window.visualViewport
    const update = () => {
      vvHeight = Math.round(vv ? vv.height : window.innerHeight)
      vvOffsetTop = Math.round(vv?.offsetTop ?? 0)
    }
    update()
    vv?.addEventListener('resize', update)
    vv?.addEventListener('scroll', update)
    window.addEventListener('orientationchange', update)
    return () => {
      vv?.removeEventListener('resize', update)
      vv?.removeEventListener('scroll', update)
      window.removeEventListener('orientationchange', update)
    }
  })

  async function handleSaveAndClose() {
    if (type !== 'music') {
      // books/games have no embedded songs field
      await upsertRecord(type, draft)
    } else {
      // ensure an id exists, then persist the album together with its songs
      const id = draft.id ?? (await upsertRecord(type, draft))
      await upsertRecord(type, { ...draft, id, songs })
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

<div
  class="fixed left-0 right-0 z-50 bg-black/60 backdrop-blur-sm flex justify-center overflow-y-auto p-3 sm:p-4 pt-[calc(env(safe-area-inset-top)+1rem)] pb-3 sm:pb-4"
  role="dialog"
  aria-modal="true"
  style="top: {vvOffsetTop}px; height: {vvHeight}px"
>
  <div class="bg-white dark:bg-black w-full max-w-3xl max-h-full rounded-2xl flex flex-col overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 m-auto">
    <header class="flex items-center gap-3 px-4 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-700">
      <span class="grid place-items-center w-9 h-9 rounded-lg bg-accent/10 text-lg shrink-0">
        {meta.emoji}
      </span>
      <div class="min-w-0">
        <p class="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
          {isNew ? 'New' : 'Edit'} {meta.singular}
        </p>
        <h2 class="text-lg sm:text-xl font-serif font-semibold leading-tight truncate">
          {isNew ? 'New Record' : draft.name || 'Edit Record'}
        </h2>
      </div>
      <button
        onclick={onclose}
        class="ml-auto shrink-0 p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
        aria-label="Close"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="m6 6 12 12M6 18 18 6" />
        </svg>
      </button>
    </header>

    <form onsubmit={e => { e.preventDefault(); handleSaveAndClose() }} class="flex-1 overflow-y-auto no-scrollbar overscroll-contain">
      <div class="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-[200px,1fr] gap-6">
        <!-- Image, fetched from the link; top-left -->
        <div class="space-y-3">
          <div class="{aspect} w-full rounded-lg bg-slate-200 dark:bg-slate-800 overflow-hidden ring-1 ring-black/5 dark:ring-white/10">
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
                {meta.emoji}
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
            <input type="text" bind:value={draft.name} required class="w-full input" placeholder={meta.namePlaceholder} />
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
            <input type="text" bind:value={draft.genre} class="w-full input" placeholder={meta.genrePlaceholder} />
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

          {#if type === 'music'}
            <label class="block">
              <span class="label">Artist</span>
              <input type="text" bind:value={draft.artist} class="w-full input" placeholder="Artist / band" />
            </label>
            <label class="block">
              <span class="label">Date listened</span>
              <input type="date" bind:value={draft.dateListened} class="w-full input" />
            </label>
          {:else}
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
            {/if}
            <label class="block">
              <span class="label">Date started</span>
              <input type="date" bind:value={draft.dateStarted} class="w-full input" />
            </label>
            <label class="block">
              <span class="label">Date finished</span>
              <input type="date" bind:value={draft.dateFinished} class="w-full input" />
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
              placeholder={meta.reviewPlaceholder}
            ></textarea>
          </label>
        </div>
      </div>
    </form>

    <footer class="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-4 border-t border-slate-200 dark:border-slate-700">
      {#if !isNew}
        <button
          onclick={handleDelete}
          class="text-sm text-red-600 hover:text-red-700 dark:text-red-400 hover:underline cursor-pointer"
        >
          Delete {meta.singular.toLowerCase()}
        </button>
      {:else}
        <span class="w-0"></span>
      {/if}
      <div class="flex flex-wrap justify-end gap-2 sm:gap-3 max-sm:w-full max-sm:[&>button]:flex-1">
        <button
          onclick={onclose}
          type="button"
          class="px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
        >
          Discard changes and close
        </button>
        <button
          onclick={handleSaveAndClose}
          type="button"
          class="px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium bg-accent hover:bg-accent-dark text-white cursor-pointer"
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
    @apply rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-black px-3 py-2 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent;
  }
</style>
