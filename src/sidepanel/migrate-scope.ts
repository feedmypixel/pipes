import * as storage from '../lib/storage'

/** One-release migration: carry the pre-scope-key localStorage Mine choice into chrome.storage
 * (where the worker can honour it) and drop the legacy key. Delete once 1.4 is the floor. */
export async function migrateLegacyScope(): Promise<void> {
  const legacy = localStorage.getItem('pipes-scope')
  if (legacy === null) {
    return
  }
  if (legacy === 'mine') {
    await storage.set('scope', 'mine')
  }
  localStorage.removeItem('pipes-scope')
}
