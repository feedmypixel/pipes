import type { Pipeline, Repo } from '../providers/types'
import * as storage from './storage'

/**
 * Notifications and the toolbar badge. The badge is the always-on glance signal;
 * notifications fire only on transitions (handled by the poll loop).
 */

const FAIL_COLOR = '#db3b21'

/** Persist the link so a click on the (possibly much later) notification opens it. */
async function rememberLink(notifId: string, url: string): Promise<void> {
  const links = await storage.get('notifLinks')
  links[notifId] = url
  await storage.set('notifLinks', links)
}

interface NotifyArgs {
  repo: Repo
  pipeline: Pipeline
}

/** Default-branch failure: sticky, high priority, you can't miss it. */
export async function notifyMainFailed({ repo, pipeline }: NotifyArgs): Promise<void> {
  const id = `pw-fail-${repo.id}-${pipeline.id}`
  await rememberLink(id, pipeline.webUrl)
  await chrome.notifications.create(id, {
    type: 'basic',
    iconUrl: '/icons/icon-128.png',
    title: `🔴 ${repo.name} · ${pipeline.ref} failed`,
    message: pipeline.title,
    priority: 2,
    requireInteraction: true
  })
}

/** Non-default-branch failure: normal toast. */
export async function notifyBranchFailed({ repo, pipeline }: NotifyArgs): Promise<void> {
  const id = `pw-fail-${repo.id}-${pipeline.id}`
  await rememberLink(id, pipeline.webUrl)
  await chrome.notifications.create(id, {
    type: 'basic',
    iconUrl: '/icons/icon-128.png',
    title: `❌ ${repo.name} · ${pipeline.ref} failed`,
    message: pipeline.title,
    priority: 1
  })
}

/** Recovery: a broken pipeline went green again. */
export async function notifyRecovered({ repo, pipeline }: NotifyArgs): Promise<void> {
  const id = `pw-ok-${repo.id}-${pipeline.id}`
  await rememberLink(id, pipeline.webUrl)
  await chrome.notifications.create(id, {
    type: 'basic',
    iconUrl: '/icons/icon-128.png',
    title: `✅ ${repo.name} · ${pipeline.ref} passed`,
    message: pipeline.title,
    priority: 0
  })
}

/** Toolbar badge = count of refs currently failing across all watched repos. */
export async function setBadge(failCount: number): Promise<void> {
  await chrome.action.setBadgeText({ text: failCount ? String(failCount) : '' })
  await chrome.action.setBadgeBackgroundColor({ color: FAIL_COLOR })
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
