import { isTokenFailure } from './health'

test.each([401, 403])('a failed check with HTTP %i is a token failure', (status) => {
  expect(isTokenFailure({ ok: false, error: 'x', status })).toBe(true)
})

test('other failures are not token failures', () => {
  expect(isTokenFailure({ ok: false, error: 'HTTP 500', status: 500 })).toBe(false)
  expect(isTokenFailure({ ok: false, error: 'Request timed out' })).toBe(false)
})

test('a healthy or unknown connection is not a token failure', () => {
  expect(isTokenFailure({ ok: true, user: 'me' })).toBe(false)
  expect(isTokenFailure(undefined)).toBe(false)
})
