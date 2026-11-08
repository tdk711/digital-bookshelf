<script>
  import { untrack } from 'svelte'
  import { MEDIA_TYPES, STATUS_LABELS } from '../db.js'
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

  let openId = $state(null) // null = closed, 'new' = new record, number = existing id
  const opened = $derived.by(() => {
    if (openId === null) return null
    if (openId === 'new') return { status: 'current' }
    return records.items.find(r => r.id === openId) ?? null
  })

  function save(record) {
    openId = null
    return record
  }
</script>

<div class="max-w-6xl mx-auto px-6 py-10">
  <div class="flex items-center justify-between mb-10">
    <h1 class="text-3xl font-bold">{meta.label}</h1>
    <button
      onclick={() => (openId = 'new')}
      class="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-accent hover:bg-accent-dark text-white text-sm font-medium transition-colors cursor-pointer"
      title="Add new record"
    >
      <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
        <path stroke-linecap="round" d="M12 5v14M5 12h14" />
      </svg>
      Add new
    </button>
  </div>

  {#if records.loading}
    <p class="text-slate-500 dark:text-slate-400">Loading…</p>
  {:else}
    <!-- Currently playing / listening -->
    <section class="mb-10">
      <h2 class="text-lg font-serif font-semibold text-accent mb-4">{meta.currentLabel}</h2>
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
        {#each records.current as record (record.id)}
          <RecordCard {record} {type} onclick={() => (openId = record.id)} />
        {:else}
          <p class="col-span-full text-sm text-slate-400">No records yet.</p>
        {/each}
      </div>
    </section>

    <!-- Upcoming -->
    <section class="mb-10">
      <h2 class="text-lg font-serif font-semibold text-accent mb-4">Upcoming</h2>
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
        {#each records.upcoming as record (record.id)}
          <RecordCard {record} {type} onclick={() => (openId = record.id)} />
        {:else}
          <p class="col-span-full text-sm text-slate-400">Nothing upcoming.</p>
        {/each}
      </div>
    </section>

    <!-- Finished / Abandoned -->
    <section>
      <h2 class="text-lg font-serif font-semibold text-accent mb-4">{finishedLabel}</h2>
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
        {#each records.finished as record (record.id)}
          <RecordCard {record} {type} onclick={() => (openId = record.id)} />
        {:else}
          <p class="col-span-full text-sm text-slate-400">No records yet.</p>
        {/each}
      </div>
    </section>
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
