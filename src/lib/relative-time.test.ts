import { relativeTime } from './relative-time'

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
