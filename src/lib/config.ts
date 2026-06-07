/**
 * Central constants. One home for the values that were scattered (and a couple that MUST stay
 * in sync, like the alarm floor used by both the worker and the options stepper). Provider
 * page sizes stay in their adapters — they're provider-specific, not cross-cutting.
 */

/** SaaS sign-in origins per provider. */
export const SAAS_HOST = {
  github: 'https://github.com',
  gitlab: 'https://gitlab.com'
} as const

/** chrome.alarms name for the poll loop. */
export const POLL_ALARM = 'pw-poll'

/** Chrome's minimum alarm period (minutes) — the floor the worker schedules at AND the options
 * stepper clamps to. Keep these reading the same constant so they can't drift. */
export const MIN_POLL_MINUTES = 0.5

/** Toolbar badge background for the failing count. */
export const BADGE_FAIL_COLOR = '#db3b21'

/** Notification id prefixes (keep distinct so failure + recovery ids never collide). */
export const NOTIF_PREFIX = {
  fail: 'pw-fail-',
  recover: 'pw-ok-'
} as const

/** How often to re-validate a connection's token (ms). Changes rarely — no need every poll. */
export const HEALTH_REFRESH_MS = 5 * 60 * 1000

/** How often to re-fetch a repo's live branches (ms). Branch membership changes slowly. */
export const BRANCH_REFRESH_MS = 10 * 60 * 1000
