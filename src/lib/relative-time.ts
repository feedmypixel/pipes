/** Compact relative time from an ISO string. `now` is passed for testability. */
export function relativeTime(iso: string, now: number): string {
  const seconds = Math.max(0, Math.floor((now - new Date(iso).getTime()) / 1000))
  if (seconds < 45) {
    return 'just now'
  }
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) {
    return `${minutes}m ago`
  }
  const hours = Math.floor(minutes / 60)
  if (hours < 24) {
    return `${hours}h ago`
  }
  return `${Math.floor(hours / 24)}d ago`
}

/**
 * Compact elapsed duration since an ISO start: "45s", "14m 32s", "1h 5m". `now` for testability.
 * Seconds stay visible through the minute range so a live timer keeps ticking; only past an hour
 * do they drop, where per-second precision is just noise.
 */
export function elapsedTime(iso: string, now: number): string {
  const totalSeconds = Math.max(0, Math.floor((now - new Date(iso).getTime()) / 1000))
  if (totalSeconds < 60) {
    return `${totalSeconds}s`
  }
  const minutes = Math.floor(totalSeconds / 60)
  if (minutes < 60) {
    return `${minutes}m ${totalSeconds % 60}s`
  }
  const hours = Math.floor(minutes / 60)
  return `${hours}h ${minutes % 60}m`
}

/** Full timestamp for a hover tooltip: "7 Jun 2026, 17:34:09" (24-hour). */
export function absoluteTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })
}
