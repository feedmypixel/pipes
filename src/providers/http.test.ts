import { parseRateLimit, fetchJson, RateLimitError, httpUrl } from './http'

const NAMES = { remaining: 'x-ratelimit-remaining', reset: 'x-ratelimit-reset' }

test('httpUrl passes http(s) URLs through', () => {
  expect(httpUrl('https://github.com/o/r/actions')).toBe('https://github.com/o/r/actions')
  expect(httpUrl('http://gitlab.local/g/p/-/pipelines')).toBe('http://gitlab.local/g/p/-/pipelines')
})

test('httpUrl rejects javascript: and other non-http schemes', () => {
  expect(httpUrl('javascript:alert(1)')).toBe('')
  expect(httpUrl('javascript:fetch("https://evil")/actions')).toBe('')
  expect(httpUrl('data:text/html,<script>1</script>')).toBe('')
  expect(httpUrl('file:///etc/passwd')).toBe('')
})

test('httpUrl returns empty on unparseable input', () => {
  expect(httpUrl('not a url')).toBe('')
  expect(httpUrl('')).toBe('')
})

test('parseRateLimit reads remaining + reset', () => {
  const headers = new Headers({ 'x-ratelimit-remaining': '42', 'x-ratelimit-reset': '1700000000' })
  expect(parseRateLimit(headers, NAMES)).toEqual({ remaining: 42, reset: 1700000000 })
})

test('parseRateLimit returns null when a header is absent', () => {
  expect(parseRateLimit(new Headers(), NAMES)).toBeNull()
})

test('parseRateLimit returns null on non-numeric values', () => {
  const headers = new Headers({ 'x-ratelimit-remaining': 'nope', 'x-ratelimit-reset': '1' })
  expect(parseRateLimit(headers, NAMES)).toBeNull()
})

test('fetchJson: 304 returns no data and echoes the sent etag', async () => {
  const original = globalThis.fetch
  globalThis.fetch = (async () => new Response(null, { status: 304 })) as typeof fetch
  try {
    const result = await fetchJson('https://example.test', {}, { etag: 'W/"abc"' })
    expect(result.status).toBe(304)
    expect(result.data).toBeNull()
    expect(result.etag).toBe('W/"abc"')
  } finally {
    globalThis.fetch = original
  }
})

test('fetchJson: 200 parses data and reads the response etag + rate-limit', async () => {
  const original = globalThis.fetch
  globalThis.fetch = (async () =>
    new Response(JSON.stringify({ ok: 1 }), {
      status: 200,
      headers: { etag: 'W/"new"', 'x-ratelimit-remaining': '10', 'x-ratelimit-reset': '99' }
    })) as typeof fetch
  try {
    const result = await fetchJson<{ ok: number }>(
      'https://example.test',
      {},
      {
        rateLimitHeaders: NAMES
      }
    )
    expect(result.data).toEqual({ ok: 1 })
    expect(result.etag).toBe('W/"new"')
    expect(result.rateLimit).toEqual({ remaining: 10, reset: 99 })
  } finally {
    globalThis.fetch = original
  }
})

test('fetchJson: non-ok throws', async () => {
  const original = globalThis.fetch
  globalThis.fetch = (async () => new Response('nope', { status: 500 })) as typeof fetch
  try {
    await expect(fetchJson('https://example.test', {})).rejects.toThrow()
  } finally {
    globalThis.fetch = original
  }
})

test('fetchJson: 429 throws RateLimitError with reset from x-ratelimit-reset', async () => {
  const original = globalThis.fetch
  globalThis.fetch = (async () =>
    new Response('limited', {
      status: 429,
      headers: { 'x-ratelimit-remaining': '0', 'x-ratelimit-reset': '1800000000' }
    })) as typeof fetch
  try {
    const error = await fetchJson('https://example.test', {}, { rateLimitHeaders: NAMES }).catch(
      (e) => e
    )
    expect(error).toBeInstanceOf(RateLimitError)
    expect((error as RateLimitError).resetAt).toBe(1800000000)
  } finally {
    globalThis.fetch = original
  }
})

test('fetchJson: 403 with exhausted budget is treated as a rate limit', async () => {
  const original = globalThis.fetch
  globalThis.fetch = (async () =>
    new Response('forbidden', {
      status: 403,
      headers: { 'x-ratelimit-remaining': '0', 'x-ratelimit-reset': '1800000001' }
    })) as typeof fetch
  try {
    await expect(
      fetchJson('https://example.test', {}, { rateLimitHeaders: NAMES })
    ).rejects.toBeInstanceOf(RateLimitError)
  } finally {
    globalThis.fetch = original
  }
})
