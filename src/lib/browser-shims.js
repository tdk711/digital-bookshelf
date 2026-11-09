// Chrome deprecates the window.InstallTrigger getter; merely *reading* it —
// e.g. the Firefox sniff `typeof InstallTrigger !== 'undefined'` inside
// dexie-cloud-addon — logs an "InstallTrigger is deprecated" warning.
// Defining it as our own plain data property (still undefined) short-circuits
// the getter: the sniff behaves identically but silently.
// NOTE: imported first in main.js, BEFORE anything evaluates the addon.
if ('InstallTrigger' in window) {
  try {
    Object.defineProperty(window, 'InstallTrigger', { value: undefined, configurable: true })
  } catch {
    // ignore: defineProperty may be blocked in odd embedding contexts
  }
}
