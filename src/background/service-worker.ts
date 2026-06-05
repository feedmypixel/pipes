import { poll } from './poll'
import * as storage from '../lib/storage'
import { openNotificationLink } from '../lib/notify'

const ALARM_NAME = 'pw-poll'
const MIN_INTERVAL = 0.5 // Chrome's floor for alarm periods.

async function scheduleAlarm(): Promise<void> {
  const { pollMinutes } = await storage.get('settings')
  await chrome.alarms.create(ALARM_NAME, {
    periodInMinutes: Math.max(MIN_INTERVAL, pollMinutes)
  })
}

// --- All listeners registered synchronously at top level (SW may restart). ---

chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    await storage.set('settings', storage.DEFAULT_SETTINGS)
  }
  await scheduleAlarm()
  await poll()
})

chrome.runtime.onStartup.addListener(() => {
  poll()
})

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === ALARM_NAME) {
    poll()
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

// Manual "refresh now" from popup / side panel.
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === 'poll-now') {
    poll().then(() => sendResponse({ ok: true }))
    return true // keep the channel open for the async response
  }
})
