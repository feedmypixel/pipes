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

/** Thrown when the provider rate-limits us; `resetAt` is epoch seconds to resume. */
export class RateLimitError extends Error {
  readonly resetAt: number
  constructor(resetAt: number) {
    super('Rate limited')
    this.name = 'RateLimitError'
    this.resetAt = resetAt
  }
}

/** Best-effort resume time (epoch seconds) from Retry-After or the provider's reset header. */
function rateLimitResetAt(headers: Headers, names?: RateLimitHeaders): number {
  const nowSeconds = Math.floor(Date.now() / 1000)
  const retryAfter = headers.get('retry-after')
  if (retryAfter) {
    const seconds = Number(retryAfter)
    if (!Number.isNaN(seconds)) {
      return nowSeconds + seconds
    }
    const dateMs = Date.parse(retryAfter)
    if (!Number.isNaN(dateMs)) {
      return Math.floor(dateMs / 1000)
    }
  }
  const reset = names ? headers.get(names.reset) : null
  if (reset) {
    const resetNumber = Number(reset)
    if (!Number.isNaN(resetNumber)) {
      return resetNumber
    }
  }
  return nowSeconds + 60
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
    // 429, or GitHub's 403 with the rate-limit budget exhausted, means back off.
    if (res.status === 429 || (res.status === 403 && rateLimit?.remaining === 0)) {
      throw new RateLimitError(rateLimitResetAt(res.headers, options.rateLimitHeaders))
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
  } catch (err) {
    // The abort fires on our timeout; surface it as something a user can read.
    if ((err as Error).name === 'AbortError') {
      throw new Error('Request timed out', { cause: err })
    }
    throw err
  } finally {
    clearTimeout(timer)
  }
}
