import type { Provider, ProviderId } from './types'
import { SAAS_HOST } from '../lib/config'
import { github } from './github'
import { gitlab } from './gitlab'

const PROVIDERS: Record<ProviderId, Provider> = { github, gitlab }

export function getProvider(id: ProviderId): Provider {
  return PROVIDERS[id]
}

/** Turn user input ("github.com", "https://x/", a path) into a bare origin, or '' if invalid. */
export function normaliseHost(input: string): string {
  const trimmed = input.trim()
  if (!trimmed) {
    return ''
  }
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
  try {
    return new URL(withProtocol).origin
  } catch {
    return ''
  }
}

/** The provider for a known SaaS host, or null for a self-hosted origin (detect by probing). */
export function saasProvider(host: string): ProviderId | null {
  const origin = normaliseHost(host)
  if (origin === SAAS_HOST.github) {
    return 'github'
  }
  if (origin === SAAS_HOST.gitlab) {
    return 'gitlab'
  }
  return null
}

export type { Account, Provider, ProviderId } from './types'
export type { Pipeline, PipelineStatus, Repo, ValidationResult } from './types'
export { TERMINAL_STATUSES } from './types'
