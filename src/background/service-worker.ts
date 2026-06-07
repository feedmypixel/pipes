import { poll } from './poll'
import * as storage from '../lib/storage'
import { POLL_ALARM, MIN_POLL_MINUTES } from '../lib/config'
import { openNotificationLink, forgetNotificationLink } from '../lib/notify'

async function scheduleAlarm(): Promise<void> {
  const { pollMinutes } = await storage.get('settings')
  await chrome.alarms.create(POLL_ALARM, {
    periodInMinutes: Math.max(MIN_POLL_MINUTES, pollMinutes)
  })
}

// --- All listeners registered synchronously at top level (SW may restart). ---

chrome.runtime.onInstalled.addListener(async (details) => {
  try {
    if (details.reason === 'install') {
      await storage.set('settings', storage.DEFAULT_SETTINGS)
    }
    await scheduleAlarm()
    await poll()
  } catch (err) {
    console.warn('onInstalled setup failed:', err)
  }
})

chrome.runtime.onStartup.addListener(() => {
  poll().catch((err) => console.warn('Startup poll failed:', err))
})

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === POLL_ALARM) {
    poll().catch((err) => console.warn('Alarm poll failed:', err))
  }
})

// Re-arm the alarm whenever the poll interval changes.
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && 'settings' in changes) {
    scheduleAlarm()
  }
})

chrome.notifications.onClicked.addListener((notifId) => {
  openNotificationLink(notifId)
})

// Reclaim the stored link when a notification is dismissed or expires unclicked.
chrome.notifications.onClosed.addListener((notifId) => {
  forgetNotificationLink(notifId)
})

// Manual "refresh now" from popup / side panel.
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === 'poll-now') {
    // The Refresh button forces a full check (bypasses throttles); the panel's interval doesn't.
    poll(message.force === true)
      .then(() => sendResponse({ ok: true }))
      .catch((err) => sendResponse({ ok: false, error: (err as Error).message }))
    return true // keep the channel open for the async response
  }
})
