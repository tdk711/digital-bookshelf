<script>
  import { untrack } from 'svelte'
  import { MEDIA_TYPES, STATUS_LABELS, STATUS_DOT } from '../db.js'
  import { useRecords } from '../store.svelte.js'
  import RecordCard from './RecordCard.svelte'
  import RecordModal from './RecordModal.svelte'

  let { type } = $props()

  // intentionally capturing the initial value only: the page is remounted
  // (via an {#key} block) whenever the media type changes
  const records = untrack(() => useRecords(type))
  const meta = untrack(() => MEDIA_TYPES[type])
  const finishedLabel = untrack(
    () => STATUS_LABELS[type].finished + ' / ' + STATUS_LABELS[type].abandoned
  )
  const aspect = untrack(() =>
    type === 'music' ? 'aspect-square' : type === 'books' ? 'aspect-[2/3]' : 'aspect-[3/4]'
  )

  let openId = $state(null) // null = closed, 'new' = new record, string = existing id
  const opened = $derived.by(() => {
    if (openId === null) return null
    if (openId === 'new') return { status: 'current' }
    return records.items.find(r => r.id === openId) ?? null
  })

  function save(record) {
    openId = null
    return record
  }

  const total = $derived(records.items.length)
  const sections = $derived([
    {
      key: 'current',
      title: meta.currentLabel,
      dot: STATUS_DOT.current,
      items: records.current,
      empty: `Nothing in progress yet — add a ${meta.singular.toLowerCase()} to get started.`
    },
    {
      key: 'upcoming',
      title: 'Upcoming',
      dot: STATUS_DOT.upcoming,
      items: records.upcoming,
      empty: 'Nothing queued up.'
    },
    {
      key: 'finished',
      title: finishedLabel,
      dot: STATUS_DOT.finished,
      items: records.finished,
      empty: 'Finished and abandoned items will appear here.'
    }
  ])
</script>

<div class="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
  <header class="mb-8 sm:mb-10">
    <p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent mb-2">Collection</p>
    <div class="flex items-start justify-between gap-4">
      <div class="min-w-0">
        <h1 class="text-3xl sm:text-4xl font-bold leading-tight">{meta.label}</h1>
        <p class="mt-2 text-sm text-slate-500 dark:text-slate-400">
          {#if records.loading}
            Loading your shelf…
          {:else if total === 0}
            {meta.tagline}
          {:else}
            {total}
            {total === 1 ? 'title' : 'titles'} · {records.current.length} in progress
          {/if}
        </p>
      </div>
      <button
        onclick={() => (openId = 'new')}
        class="shrink-0 inline-flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded-xl bg-accent hover:bg-accent-dark text-white text-sm font-medium transition-colors shadow-sm cursor-pointer whitespace-nowrap"
        title="Add new record"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
          <path stroke-linecap="round" d="M12 5v14M5 12h14" />
        </svg>
        Add {meta.singular.toLowerCase()}
      </button>
    </div>
  </header>

  {#if records.loading}
    <!-- skeleton shelf while the live query settles -->
    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
      {#each Array(5) as _}
        <div class="animate-pulse">
          <div class="{aspect} rounded-xl bg-slate-200 dark:bg-slate-800"></div>
          <div class="mt-3 h-3 w-3/4 rounded bg-slate-200 dark:bg-slate-800"></div>
        </div>
      {/each}
    </div>
  {:else}
    {#each sections as section (section.key)}
      <section class="mb-10 last:mb-0">
        <div class="flex items-center gap-2.5 mb-4">
          <span class="w-2 h-2 rounded-full {section.dot}"></span>
          <h2 class="text-lg font-serif font-semibold">{section.title}</h2>
          <span
            class="inline-flex items-center justify-center min-w-6 h-6 px-2 rounded-full bg-slate-200/80 dark:bg-slate-800 text-[11px] font-semibold text-slate-500 dark:text-slate-400"
          >
            {section.items.length}
          </span>
        </div>

        {#if section.items.length === 0}
          <div
            class="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 px-4 py-5 text-sm text-slate-400 dark:text-slate-500"
          >
            {section.empty}
          </div>
        {:else}
          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
            {#each section.items as record (record.id)}
              <RecordCard {record} {type} onclick={() => (openId = record.id)} />
            {/each}
          </div>
        {/if}
      </section>
    {/each}
  {/if}
</div>

{#if opened}
  <RecordModal
    type={type}
    record={opened}
    onsave={save}
    onclose={() => (openId = null)}
  />
{/if}
