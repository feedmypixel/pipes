import { poll } from './poll'
import * as storage from '../lib/storage'
import { POLL_ALARM, MIN_POLL_MINUTES, LIVE_PORT, LIVE_POLL_MS } from '../lib/config'
import { openNotificationLink, forgetNotificationLink } from '../lib/notify'

async function scheduleAlarm(): Promise<void> {
  const { pollMinutes } = await storage.get('settings')
  await chrome.alarms.create(POLL_ALARM, {
    periodInMinutes: Math.max(MIN_POLL_MINUTES, pollMinutes)
  })
}

// Live polling, driven from here (not a panel's setInterval, which Chrome throttles to ~1/min when
// the panel document is backgrounded). An open surface holds a LIVE_PORT; while ≥1 is connected the
// worker stays alive and self-schedules a fast fresh poll. These globals only live as long as a port
// keeps the worker alive, so they don't need to survive a worker restart.
let liveConnections = 0
let liveTimer: ReturnType<typeof setTimeout> | undefined

function liveLoop(): void {
  poll(false, true).catch((err) => console.warn('Live poll failed:', err))
  liveTimer = setTimeout(liveLoop, LIVE_POLL_MS)
}

chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== LIVE_PORT) {
    return
  }
  liveConnections++
  if (!liveTimer) {
    liveLoop() // poll immediately on the first open surface, then every LIVE_POLL_MS
  }
  port.onDisconnect.addListener(() => {
    liveConnections--
    if (liveConnections <= 0) {
      liveConnections = 0
      clearTimeout(liveTimer)
      liveTimer = undefined
    }
  })
})

// --- All listeners registered synchronously at top level (SW may restart). ---

chrome.runtime.onInstalled.addListener(async (details) => {
  try {
    if (details.reason === 'install') {
      await storage.set('settings', storage.DEFAULT_SETTINGS)
    }
    await storage.migrate() // clear caches whose shape changed across this version
    await scheduleAlarm()
    await poll()
  } catch (err) {
    console.warn('onInstalled setup failed:', err)
  }
})

chrome.runtime.onStartup.addListener(() => {
  storage
    .migrate()
    .then(() => poll())
    .catch((err) => console.warn('Startup poll failed:', err))
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

// The single action button ("Open run" / "Open PR" / "Open") opens the same link as a body click.
chrome.notifications.onButtonClicked.addListener((notifId) => {
  openNotificationLink(notifId)
})

// Reclaim the stored link when a notification is dismissed or expires unclicked.
chrome.notifications.onClosed.addListener((notifId) => {
  forgetNotificationLink(notifId)
})

// Manual "refresh now" from popup / side panel.
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === 'poll-now') {
    // Manual Refresh: force a full re-check and skip the ETag (fresh) for live status. The recurring
    // live poll is driven by the LIVE_PORT loop above, not this message.
    poll(message.force === true, message.fresh === true)
      .then(() => sendResponse({ ok: true }))
      .catch((err) => sendResponse({ ok: false, error: (err as Error).message }))
    return true // keep the channel open for the async response
  }
})
