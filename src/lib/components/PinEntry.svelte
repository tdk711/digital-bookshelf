<script>
  import { unlockWithPin, validatePinFormat } from '../pin-auth.js'
  import BrandMark from './BrandMark.svelte'

  let pin = $state('')
  let error = $state('')
  let isLoading = $state(false)

  // iOS keyboard viewport handling
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

  async function handleSubmit(e) {
    e.preventDefault()
    error = ''
    const validation = validatePinFormat(pin)
    if (!validation.valid) {
      error = validation.message
      return
    }

    isLoading = true
    try {
      await unlockWithPin(pin)
      // Success - App.svelte will handle navigation
    } catch (e) {
      error = 'Failed to unlock. Please try again.'
      console.error(e)
    } finally {
      isLoading = false
    }
  }

  // Clear error when user types
  $effect(() => {
    if (pin) error = ''
  })
</script>

<div
  class="fixed left-0 right-0 z-[60] bg-black/50 flex justify-center overflow-y-auto pt-[calc(env(safe-area-inset-top)+1rem)] pb-4 px-4"
  role="dialog"
  aria-modal="true"
  style="top: {vvOffsetTop}px; height: {vvHeight}px"
>
  <div class="bg-white dark:bg-black w-full max-w-sm rounded-2xl shadow-xl overflow-hidden m-auto">
    <header class="px-6 pt-6 pb-2 text-center">
      <div class="flex justify-center mb-4">
        <BrandMark size="lg" />
      </div>
      <h2 class="text-xl font-serif font-semibold">Welcome to your Bookshelf</h2>
      <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Enter your shared alphanumeric PIN to unlock your library.
        <br class="hidden sm:block" />
        <span class="text-xs text-slate-400">Same PIN works on all your devices.</span>
      </p>
    </header>

    <form onsubmit={handleSubmit} class="px-6 pb-6 space-y-4">
      {#if error}
        <p class="text-xs px-3 py-2 rounded-lg border bg-red-50 text-red-700 border-red-200 dark:bg-red-900/40 dark:text-red-200 dark:border-red-900" role="alert">
          {error}
        </p>
      {/if}

      <label class="block">
        <span class="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
          PIN (letters & numbers)
        </span>
        <input
          type="password"
          bind:value={pin}
          required
          autocomplete="off"
          autocapitalize="none"
          autocorrect="off"
          spellcheck="false"
          inputmode="text"
          placeholder="Enter your PIN"
          class="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-black px-3 py-2.5 text-slate-900 dark:text-white text-left placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent text-base sm:text-sm text-center text-lg tracking-[0.3em] font-semibold"
          disabled={isLoading}
        />
      </label>

      <button
        type="submit"
        class="w-full px-4 py-2.5 rounded-lg text-sm font-medium bg-accent hover:bg-accent-dark text-white cursor-pointer disabled:opacity-50"
        disabled={isLoading || !pin}
      >
        {isLoading ? 'Unlocking…' : 'Unlock Library'}
      </button>

      <p class="pt-1 text-center text-[11px] text-slate-400 dark:text-slate-500">
        Your data is stored locally and synced via Cloudflare D1
      </p>
    </form>
  </div>
</div>