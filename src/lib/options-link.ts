import browser from './browser'
import { OPTIONS_PAGE } from './config'

export function replaceHash(accountId: string): string {
  return `#replace=${encodeURIComponent(accountId)}`
}

export function replaceTarget(hash: string): string | null {
  return new URLSearchParams(hash.replace(/^#/, '')).get('replace')
}

/** Open Options at an account's Replace token form, reusing an Options tab that's already open. */
export async function openReplaceToken(accountId: string): Promise<void> {
  const hash = replaceHash(accountId)
  const openOptions = browser.extension
    .getViews({ type: 'tab' })
    .find((view) => view.location.pathname === `/${OPTIONS_PAGE}`)
  if (openOptions) {
    // Focus first, while the tab's URL still matches the plain options page.
    await browser.runtime.openOptionsPage()
    openOptions.location.hash = hash
    return
  }
  await browser.tabs.create({ url: browser.runtime.getURL(`${OPTIONS_PAGE}${hash}`) })
}
