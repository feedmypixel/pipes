import type { AccountHealth } from './storage'

const TOKEN_REJECTED_STATUSES = new Set([401, 403])

/** The provider rejected the token (expired, revoked or missing a permission). */
export function isTokenFailure(health: AccountHealth | undefined): boolean {
  return health?.ok === false && TOKEN_REJECTED_STATUSES.has(health.status ?? 0)
}
