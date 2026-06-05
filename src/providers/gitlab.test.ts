import { mapGitlabStatus } from './gitlab'

test('maps terminal GitLab statuses', () => {
  expect(mapGitlabStatus('success')).toBe('success')
  expect(mapGitlabStatus('failed')).toBe('failed')
  expect(mapGitlabStatus('canceled')).toBe('canceled')
  expect(mapGitlabStatus('skipped')).toBe('skipped')
})

test('maps in-flight GitLab statuses', () => {
  expect(mapGitlabStatus('running')).toBe('running')
  expect(mapGitlabStatus('pending')).toBe('pending')
  expect(mapGitlabStatus('created')).toBe('pending')
  expect(mapGitlabStatus('waiting_for_resource')).toBe('pending')
  expect(mapGitlabStatus('preparing')).toBe('pending')
  expect(mapGitlabStatus('scheduled')).toBe('pending')
  expect(mapGitlabStatus('manual')).toBe('pending')
})

test('maps unknown GitLab status to unknown', () => {
  expect(mapGitlabStatus('something-new')).toBe('unknown')
})
