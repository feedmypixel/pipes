import { relativeTime, elapsedTime, absoluteTime } from './relative-time'

const now = Date.parse('2026-06-05T12:00:00Z')

test('formats recent times by the largest fitting unit', () => {
  expect(relativeTime('2026-06-05T11:59:30Z', now)).toBe('just now')
  expect(relativeTime('2026-06-05T11:50:00Z', now)).toBe('10m ago')
  expect(relativeTime('2026-06-05T07:00:00Z', now)).toBe('5h ago')
  expect(relativeTime('2026-06-03T12:00:00Z', now)).toBe('2d ago')
})

test('clamps future timestamps to just now', () => {
  expect(relativeTime('2026-06-05T12:05:00Z', now)).toBe('just now')
})

test('elapsedTime keeps seconds through the minute range, drops them past an hour', () => {
  expect(elapsedTime('2026-06-05T11:59:20Z', now)).toBe('40s')
  expect(elapsedTime('2026-06-05T11:45:28Z', now)).toBe('14m 32s')
  expect(elapsedTime('2026-06-05T11:46:00Z', now)).toBe('14m 0s')
  expect(elapsedTime('2026-06-05T10:47:00Z', now)).toBe('1h 13m')
})

test('elapsedTime clamps future starts to 0s', () => {
  expect(elapsedTime('2026-06-05T12:05:00Z', now)).toBe('0s')
})

test('absoluteTime gives a full timestamp (year + 24h time with seconds), locale/tz aside', () => {
  const out = absoluteTime('2026-06-07T17:34:09Z')
  expect(out).toMatch(/2026/)
  expect(out).toMatch(/\d{1,2}:\d{2}:\d{2}/)
})
