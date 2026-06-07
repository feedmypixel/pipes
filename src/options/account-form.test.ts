import {
  hostForChoice,
  validateForm,
  hasErrors,
  summaryErrors,
  candidateProviders,
  accountLabel
} from './account-form'
import { SAAS_HOST } from '../lib/config'

test('hostForChoice maps SaaS choices to their origin, self-hosted to blank', () => {
  expect(hostForChoice('github')).toBe(SAAS_HOST.github)
  expect(hostForChoice('gitlab')).toBe(SAAS_HOST.gitlab)
  expect(hostForChoice('self')).toBe('')
})

test('validateForm flags blank/whitespace fields only', () => {
  expect(validateForm('', '')).toEqual({ host: 'Enter a host', token: 'Enter a token' })
  expect(validateForm('  ', '  ')).toEqual({ host: 'Enter a host', token: 'Enter a token' })
  expect(validateForm('github.com', 'tok')).toEqual({ host: undefined, token: undefined })
})

test('hasErrors is true when either field errored', () => {
  expect(hasErrors({ host: 'Enter a host' })).toBe(true)
  expect(hasErrors({ token: 'Enter a token' })).toBe(true)
  expect(hasErrors({ host: undefined, token: undefined })).toBe(false)
})

test('summaryErrors lists set errors in field order', () => {
  expect(summaryErrors({ host: 'Enter a host', token: 'Enter a token' })).toEqual([
    { name: 'host', message: 'Enter a host' },
    { name: 'token', message: 'Enter a token' }
  ])
  expect(summaryErrors({ token: 'Enter a token' })).toEqual([
    { name: 'token', message: 'Enter a token' }
  ])
  expect(summaryErrors({})).toEqual([])
})

test('candidateProviders narrows to the known SaaS provider, else probes both', () => {
  expect(candidateProviders('github')).toEqual(['github'])
  expect(candidateProviders('gitlab')).toEqual(['gitlab'])
  expect(candidateProviders(null)).toEqual(['github', 'gitlab'])
})

test('accountLabel falls back to the bare host when no label given', () => {
  expect(accountLabel('Work', 'https://github.com')).toBe('Work')
  expect(accountLabel('  ', 'https://gitlab.example.com')).toBe('gitlab.example.com')
  expect(accountLabel('', 'http://ghe.local')).toBe('ghe.local')
})
