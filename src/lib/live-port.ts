import { LIVE_PORT } from './config'

/**
 * Hold a live port open so the service worker drives the fast poll loop while a surface is visible.
 *
 * An MV3 worker is recycled even with a port held (~5 min cap), which disconnects the port and
 * stops the loop. So we reconnect on disconnect — a fresh connection wakes the worker and restarts
 * its loop — keeping a long-open panel on live cadence rather than silently dropping to the alarm.
 *
 * Returns a teardown for the caller's `$effect` cleanup.
 */
export function holdLivePort(): () => void {
  let port: chrome.runtime.Port | undefined
  let retry: ReturnType<typeof setTimeout> | undefined
  let stopped = false

  function connect(): void {
    port = chrome.runtime.connect({ name: LIVE_PORT })
    port.onDisconnect.addListener(() => {
      if (!stopped) {
        retry = setTimeout(connect, 1000) // worker recycled — reconnect to restart its loop
      }
    })
  }
  connect()

  return () => {
    stopped = true
    clearTimeout(retry)
    port?.disconnect()
  }
}
