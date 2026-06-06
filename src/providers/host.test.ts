import { normaliseHost, saasProvider } from './index'

test('normaliseHost turns input into a bare origin', () => {
  expect(normaliseHost('github.com')).toBe('https://github.com')
  expect(normaliseHost('https://gitlab.com/')).toBe('https://gitlab.com')
  expect(normaliseHost('https://gitlab.example.com/group/project')).toBe(
    'https://gitlab.example.com'
  )
  expect(normaliseHost('  github.com  ')).toBe('https://github.com')
})

test('normaliseHost returns empty for blank or invalid input', () => {
  expect(normaliseHost('')).toBe('')
  expect(normaliseHost('   ')).toBe('')
  expect(normaliseHost('http://')).toBe('')
})

test('saasProvider detects the SaaS hosts, null for self-hosted', () => {
  expect(saasProvider('github.com')).toBe('github')
  expect(saasProvider('https://gitlab.com')).toBe('gitlab')
  expect(saasProvider('gitlab.example.com')).toBe(null)
  expect(saasProvider('github.enterprise.io')).toBe(null)
})
