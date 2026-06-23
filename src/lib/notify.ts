import type { Change, Pipeline, Repo } from '../providers/types'
import * as storage from './storage'
import { BADGE_FAIL_COLOR, NOTIF_PREFIX } from './config'
import browser from './browser'
import { isFirefox } from './platform'

// Packaged status glyphs (see manifest web_accessible_resources). Used as the notification icon
// so the toast leads with a red cross / green tick, not the app's green-tick logo.
const ICON_FAILED = '/icons/status-failed.png'
const ICON_SUCCESS = '/icons/status-success.png'

/**
 * Notifications and the toolbar badge. The badge is the always-on glance signal;
 * notifications fire only on transitions (handled by the poll loop).
 */

// Serialise notifLinks writes: a poll cycle fires notifications from repos polled concurrently,
// and a bare get→set would let two of them race and drop a link. Chaining keeps each
// read-modify-write atomic. Transient state — only needs to hold across one cycle.
let linkWrites: Promise<void> = Promise.resolve()

/** Persist the link so a click on the (possibly much later) notification opens it. */
function rememberLink(notifId: string, url: string): Promise<void> {
  linkWrites = linkWrites.then(async () => {
    const links = await storage.get('notifLinks')
    links[notifId] = url
    await storage.set('notifLinks', links)
  })
  return linkWrites
}

/** Repo name without the owner prefix — the notification is already short on space. */
function shortName(repo: Repo): string {
  return repo.name.split('/').pop() ?? repo.name
}

/** Default-branch failure: sticky, high priority, you can't miss it. */
export async function notifyMainFailed({
  repo,
  pipeline
}: {
  repo: Repo
  pipeline: Pipeline
}): Promise<void> {
  const id = `${NOTIF_PREFIX.fail}${repo.id}-default`
  await rememberLink(id, pipeline.webUrl)
  await browser.notifications.create(id, {
    type: 'basic',
    iconUrl: ICON_FAILED,
    title: `${shortName(repo)} · ${repo.defaultBranch} failed`,
    message: pipeline.title,
    ...(isFirefox()
      ? {}
      : {
          contextMessage: repo.name,
          buttons: [{ title: 'Open' }],
          priority: 2,
          requireInteraction: true
        })
  })
}

/** An open PR/MR's checks failed: normal toast, links to that PR/MR. */
export async function notifyChangeFailed({
  repo,
  change
}: {
  repo: Repo
  change: Change
}): Promise<void> {
  const id = `${NOTIF_PREFIX.fail}${repo.id}-pr-${change.number}`
  await rememberLink(id, change.webUrl)
  await browser.notifications.create(id, {
    type: 'basic',
    iconUrl: ICON_FAILED,
    title: `${shortName(repo)} · #${change.number} failed`,
    message: change.title,
    ...(isFirefox()
      ? {}
      : { contextMessage: change.headRef, buttons: [{ title: 'Open' }], priority: 1 })
  })
}

/**
 * Recovery: a previously-failing default branch or PR/MR went green again. `key` mirrors the
 * failure id's suffix (`default` / `pr-{number}`) so a thing's fail + recover ids are a stable
 * pair; `label` is the human-readable name shown in the toast.
 */
export async function notifyRecovered({
  repo,
  key,
  label,
  url
}: {
  repo: Repo
  key: string
  label: string
  url: string
}): Promise<void> {
  const id = `${NOTIF_PREFIX.recover}${repo.id}-${key}`
  await rememberLink(id, url)
  await browser.notifications.create(id, {
    type: 'basic',
    iconUrl: ICON_SUCCESS,
    title: `${shortName(repo)} · ${label} recovered`,
    message: 'Back to green',
    ...(isFirefox() ? {} : { contextMessage: repo.name, buttons: [{ title: 'Open' }], priority: 0 })
  })
}

/** Toolbar badge = count of refs currently failing across all watched repos. */
export async function setBadge(failCount: number): Promise<void> {
  await browser.action.setBadgeText({ text: failCount ? String(failCount) : '' })
  await browser.action.setBadgeBackgroundColor({ color: BADGE_FAIL_COLOR })
}

/** Drop a stored link. Called when a notification is closed or after it's opened. */
export async function forgetNotificationLink(notifId: string): Promise<void> {
  const links = await storage.get('notifLinks')
  if (notifId in links) {
    delete links[notifId]
    await storage.set('notifLinks', links)
  }
}

/** Open the pipeline a notification points at, then forget the link. */
export async function openNotificationLink(notifId: string): Promise<void> {
  const url = (await storage.get('notifLinks'))[notifId]
  if (!url) {
    return
  }
  await browser.tabs.create({ url })
  await browser.notifications.clear(notifId)
  await forgetNotificationLink(notifId)
}
