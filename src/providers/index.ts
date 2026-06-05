import type { Account, Provider, ProviderId } from './types'
import { github } from './github'
import { gitlab } from './gitlab'

const PROVIDERS: Record<ProviderId, Provider> = { github, gitlab }

export function providerFor(account: Account): Provider {
  return PROVIDERS[account.provider]
}

/** Default sign-in origin for a provider's SaaS offering. */
export function defaultHost(provider: ProviderId): string {
  return provider === 'github' ? 'https://github.com' : 'https://gitlab.com'
}

export type { Account, Provider, ProviderId } from './types'
export type { Pipeline, PipelineStatus, Repo, ValidationResult } from './types'
export { TERMINAL_STATUSES } from './types'
