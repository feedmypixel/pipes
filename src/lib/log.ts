import pino from 'pino'

/**
 * Central logger. Level-gated: verbose in dev, `warn`+ in production (so shipped builds stay
 * quiet unless something's wrong). Never log tokens — pass messages + error text, never an
 * `Account` or the token itself.
 */
export const log = pino({
  level: import.meta.env.DEV ? 'debug' : 'warn',
  browser: { asObject: false }
})
