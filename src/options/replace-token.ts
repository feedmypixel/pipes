import type { Account, ValidationResult } from '../providers/types'

export type ReplaceOutcome =
  | { kind: 'ok'; user?: string }
  | { kind: 'other-account'; user: string }
  | { kind: 'rejected'; error?: string; status?: number }

// Blocks a different login: the watched repos belong to the original one.
export function replaceOutcome(account: Account, result: ValidationResult): ReplaceOutcome {
  if (!result.ok) {
    return { kind: 'rejected', error: result.error, status: result.status }
  }
  if (account.user && result.user && result.user.toLowerCase() !== account.user.toLowerCase()) {
    return { kind: 'other-account', user: result.user }
  }
  return { kind: 'ok', user: result.user }
}

export function pausedRepos(count: number): string {
  return count === 1 ? '1 watched repo is paused' : `${count} watched repos are paused`
}

export function repoCount(count: number): string {
  return `${count} ${count === 1 ? 'repo' : 'repos'}`
}
