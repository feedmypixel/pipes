/** Shared fetch concerns for providers: timeout, conditional requests (ETag),
   and rate-limit header parsing. One place so GitHub + GitLab behave the same. */

const TIMEOUT_MS = 10_000

export interface RateLimit {
  remaining: number
  /** Epoch seconds when the window resets. */
  reset: number
}

/** Header names differ per provider (GitHub `X-RateLimit-*`, GitLab `RateLimit-*`). */
export interface RateLimitHeaders {
  remaining: string
  reset: string
}

export interface HttpResponse<T> {
  status: number
  /** null on 304 Not Modified. */
  data: T | null
  etag: string | null
  rateLimit: RateLimit | null
}

export function parseRateLimit(headers: Headers, names: RateLimitHeaders): RateLimit | null {
  const remaining = headers.get(names.remaining)
  const reset = headers.get(names.reset)
  if (remaining === null || reset === null) {
    return null
  }
  const remainingNumber = Number(remaining)
  const resetNumber = Number(reset)
  if (Number.isNaN(remainingNumber) || Number.isNaN(resetNumber)) {
    return null
  }
  return { remaining: remainingNumber, reset: resetNumber }
}

/**
 * Fetch JSON with a timeout and optional conditional request.
 * - Passing `etag` sends `If-None-Match`; a 304 returns `{ data: null }` (no rate-limit cost on
 *   GitHub) so the caller can keep its cached result.
 * - Throws on network error, timeout (abort), and non-2xx/304 responses.
 */
export async function fetchJson<T>(
  url: string,
  headers: Record<string, string>,
  options: { etag?: string | null; rateLimitHeaders?: RateLimitHeaders } = {}
): Promise<HttpResponse<T>> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const requestHeaders: Record<string, string> = { ...headers }
    if (options.etag) {
      requestHeaders['If-None-Match'] = options.etag
    }
    const res = await fetch(url, { headers: requestHeaders, signal: controller.signal })
    const rateLimit = options.rateLimitHeaders
      ? parseRateLimit(res.headers, options.rateLimitHeaders)
      : null
    if (res.status === 304) {
      return { status: 304, data: null, etag: options.etag ?? null, rateLimit }
    }
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText} on ${url}`)
    }
    return {
      status: res.status,
      data: (await res.json()) as T,
      etag: res.headers.get('etag'),
      rateLimit
    }
  } finally {
    clearTimeout(timer)
  }
}
