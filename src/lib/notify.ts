import type { Change, Pipeline, Repo } from '../providers/types'
import * as storage from './storage'
import { BADGE_FAIL_COLOR, NOTIF_PREFIX } from './config'

/**
 * Notifications and the toolbar badge. The badge is the always-on glance signal;
 * notifications fire only on transitions (handled by the poll loop).
 */

/** Persist the link so a click on the (possibly much later) notification opens it. */
async function rememberLink(notifId: string, url: string): Promise<void> {
  const links = await storage.get('notifLinks')
  links[notifId] = url
  await storage.set('notifLinks', links)
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
  await chrome.notifications.create(id, {
    type: 'basic',
    iconUrl: '/icons/icon-128.png',
    title: `${shortName(repo)} · ${repo.defaultBranch} failed`,
    message: pipeline.title,
    contextMessage: repo.name,
    buttons: [{ title: 'Open run' }],
    priority: 2,
    requireInteraction: true
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
  await chrome.notifications.create(id, {
    type: 'basic',
    iconUrl: '/icons/icon-128.png',
    title: `${shortName(repo)} · #${change.number} failed`,
    message: change.title,
    contextMessage: change.headRef,
    buttons: [{ title: 'Open PR' }],
    priority: 1
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
  await chrome.notifications.create(id, {
    type: 'basic',
    iconUrl: '/icons/icon-128.png',
    title: `${shortName(repo)} · ${label} recovered`,
    message: 'Back to green',
    contextMessage: repo.name,
    buttons: [{ title: 'Open' }],
    priority: 0
  })
}

/** Toolbar badge = count of refs currently failing across all watched repos. */
export async function setBadge(failCount: number): Promise<void> {
  await chrome.action.setBadgeText({ text: failCount ? String(failCount) : '' })
  await chrome.action.setBadgeBackgroundColor({ color: BADGE_FAIL_COLOR })
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
  await chrome.tabs.create({ url })
  await chrome.notifications.clear(notifId)
  await forgetNotificationLink(notifId)
}
