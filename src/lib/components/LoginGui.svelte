<script>
  // Custom login GUI for Dexie Cloud (customLoginGui: true in db.js).
  // Dexie Cloud still performs the actual email-OTP authentication; this
  // simply renders its prompts according to the app's design.
  import { db } from '../db.js'

  let ui = $state(null)
  let values = $state({})
  let user = $state(null)
  let sawAuthPrompt = $state(false)
  let sawOtpStep = $state(false)

  $effect(() => {
    const sub = db.cloud.userInteraction.subscribe({
      next: nextUi => {
        ui = nextUi ? $state.snapshot(nextUi) : null
        if (nextUi && (nextUi.type === 'email' || nextUi.type === 'otp')) sawAuthPrompt = true
        if (nextUi?.type === 'otp') sawOtpStep = true // the OTP step was reached
      },
      error: console.error
    })
    const userSub = db.cloud.currentUser.subscribe({
      next: u => (user = u && u.isLoggedIn ? $state.snapshot(u) : null),
      error: () => {}
    })

    // Fallback: if the addon's startup login flow stalls (e.g. it failed before
    // emitting a prompt), restart it explicitly once the app has settled.
    const retry = setTimeout(() => {
      if (!ui && !user) db.cloud.login().catch(() => {})
    }, 500)

    return () => {
      clearTimeout(retry)
      sub.unsubscribe()
      userSub.unsubscribe()
    }
  })

  // one-time login flows can stall (addon's startup auth raced with ours);
  // if the OTP prompt was shown and CLOSED but we're STILL not logged in,
  // reload once — the persisted session boots straight into the app
  $effect(() => {
    if (sawOtpStep && !ui && !user) {
      const t = setTimeout(() => location.reload(), 2500)
      return () => clearTimeout(t)
    }
  })

  const fields = $derived(ui ? Object.entries(ui.fields) : [])
  const isEmail = $derived(ui?.type === 'email')
  const isOtp = $derived(ui?.type === 'otp')
  const isConfirmation = $derived(ui?.type === 'logout-confirmation')

  $effect(() => {
    if (ui) values = Object.fromEntries(Object.entries(ui.fields).map(([name]) => [name, '']))
  })

  function submit(e) {
    e.preventDefault()
    if (ui?.onSubmit) ui.onSubmit(values)
  }

  const alertClass = {
    error: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/40 dark:text-red-200 dark:border-red-900',
    warning: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/40 dark:text-amber-200 dark:border-amber-900',
    info: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-200 dark:border-blue-900'
  }

  $effect(() => {
    if (ui) {
      const input = document.querySelector('[role="dialog"] form input')
      input?.focus()
    }
  })
</script>

{#if ui}
  <div class="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
    <div class="bg-white dark:bg-black w-full max-w-sm rounded-2xl shadow-xl overflow-hidden">
      <header class="px-6 pt-6 pb-2 text-center">
        <svg class="w-10 h-10 mx-auto mb-3 text-accent" fill="currentColor" viewBox="0 0 64 64">
          <path d="M8 6h10v52H8zM22 12h10v46H22zM36 6h10v52H36z" opacity="0.9" />
        </svg>
        <h2 class="text-xl font-serif font-semibold">
          {#if isEmail}Welcome to your Bookshelf{:else if isOtp}Check your email{:else}{ui.title}{/if}
        </h2>
        <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {#if isEmail}
            Sign in with your email to get a one-time code.
          {:else if isOtp}
            {#each ui.alerts as alert (alert.messageCode)}
              {#if alert.messageCode === 'OTP_SENT'}
                We sent a one-time code to {alert.messageParams?.email || values.email || 'your email'}.
              {/if}
            {/each}
          {:else}
            {ui.title}
          {/if}
        </p>
      </header>

      <form onsubmit={submit} class="px-6 pb-6 space-y-4">
        {#each ui.alerts as alert (alert.type + alert.messageCode + alert.message)}
          {#if alert.messageCode !== 'OTP_SENT'}
            <p
              class="text-xs px-3 py-2 rounded-lg border {alertClass[alert.type] || alertClass.info}"
              role="alert"
            >
              {alert.message}
            </p>
          {/if}
        {/each}

        {#each fields as [fieldName, field] (fieldName)}
          <label class="block">
            {#if field.label}
              <span class="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 lowercase">
                {field.label}
              </span>
            {/if}
            <!-- type="text" so OTP accepts both numeric and alphanumeric codes -->
            <input
              type="text"
              inputmode={fieldName === 'otp' ? 'numeric' : undefined}
              placeholder={field.placeholder || field.label || ''}
              bind:value={values[fieldName]}
              required
              class="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-black px-3 py-2.5 text-slate-900 dark:text-white text-left placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent {isOtp
                ? 'lowercase text-lg tracking-[0.3em] font-semibold'
                : ''}"
            />
          </label>
        {/each}

        <div class="space-y-2">
          {#if ui.fields && Object.keys(ui.fields).length > 0}
            <button
              type="submit"
              class="w-full px-4 py-2.5 rounded-lg text-sm font-medium bg-accent hover:bg-accent-dark text-white cursor-pointer"
            >
              {ui.submitLabel || 'Sign in'}
            </button>
          {/if}
          <!-- no cancel for the email step; OTP / confirmation prompts may still cancel -->
          {#if ui.cancelLabel && !isEmail}
            <button
              type="button"
              onclick={() => ui.onCancel?.()}
              class="w-full px-4 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
            >
              {ui.cancelLabel}
            </button>
          {/if}
        </div>
      </form>
    </div>
  </div>
{/if}
