import { replaceOutcome, pausedRepos, repoCount } from './replace-token'
import type { Account } from '../providers/types'

const account: Account = {
  id: 'a1',
  provider: 'github',
  label: 'work',
  host: 'https://github.com',
  token: 'old',
  user: 'feedmypixel'
}

test('a token signing in as the same user is ok', () => {
  expect(replaceOutcome(account, { ok: true, user: 'feedmypixel' })).toEqual({
    kind: 'ok',
    user: 'feedmypixel'
  })
})

test('the same-user check ignores case (logins are case-insensitive)', () => {
  expect(replaceOutcome(account, { ok: true, user: 'FeedMyPixel' }).kind).toBe('ok')
})

test('a token for a different user is blocked', () => {
  expect(replaceOutcome(account, { ok: true, user: 'alex-k' })).toEqual({
    kind: 'other-account',
    user: 'alex-k'
  })
})

test('a legacy account without a stored user accepts any valid token', () => {
  const legacy = { ...account, user: undefined }
  expect(replaceOutcome(legacy, { ok: true, user: 'alex-k' })).toEqual({
    kind: 'ok',
    user: 'alex-k'
  })
})

test('a failed check is rejected with its status and reason', () => {
  expect(replaceOutcome(account, { ok: false, error: 'HTTP 401', status: 401 })).toEqual({
    kind: 'rejected',
    error: 'HTTP 401',
    status: 401
  })
})

test('counts read naturally in the singular and plural', () => {
  expect(pausedRepos(1)).toBe('1 watched repo is paused')
  expect(pausedRepos(4)).toBe('4 watched repos are paused')
  expect(repoCount(1)).toBe('1 repo')
  expect(repoCount(0)).toBe('0 repos')
})
