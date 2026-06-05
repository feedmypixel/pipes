import { mapGithubStatus } from './github'

test('maps completed GitHub runs by conclusion', () => {
  expect(mapGithubStatus('completed', 'success')).toBe('success')
  expect(mapGithubStatus('completed', 'failure')).toBe('failed')
  expect(mapGithubStatus('completed', 'timed_out')).toBe('failed')
  expect(mapGithubStatus('completed', 'cancelled')).toBe('canceled')
  expect(mapGithubStatus('completed', 'skipped')).toBe('skipped')
})

test('maps in-flight GitHub runs by status, ignoring conclusion', () => {
  expect(mapGithubStatus('in_progress', null)).toBe('running')
  expect(mapGithubStatus('queued', null)).toBe('pending')
  expect(mapGithubStatus('waiting', null)).toBe('pending')
  expect(mapGithubStatus('requested', null)).toBe('pending')
})

test('treats a completed run with no conclusion yet as still settling', () => {
  expect(mapGithubStatus('completed', null)).toBe('pending')
})

test('maps unrecognised conclusion to unknown', () => {
  expect(mapGithubStatus('completed', 'neutral')).toBe('unknown')
})
