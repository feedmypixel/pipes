import { parseRateLimit, fetchJson } from './http'

const NAMES = { remaining: 'x-ratelimit-remaining', reset: 'x-ratelimit-reset' }

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
