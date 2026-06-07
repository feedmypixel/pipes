import type { ProviderId } from '../providers/types'
import { SAAS_HOST } from '../lib/config'

export type HostChoice = 'github' | 'gitlab' | 'self'
export type FormErrors = { host?: string; token?: string }
export type FieldError = { name: string; message: string }

/** Host origin for a provider choice; self-hosted starts blank for the user to fill in. */
export function hostForChoice(choice: HostChoice): string {
  return choice === 'self' ? '' : SAAS_HOST[choice]
}

/** Required-field check for the add-connection form. */
export function validateForm(host: string, token: string): FormErrors {
  return {
    host: host.trim() ? undefined : 'Enter a host',
    token: token.trim() ? undefined : 'Enter a token'
  }
}

export function hasErrors(errors: FormErrors): boolean {
  return Boolean(errors.host || errors.token)
}

/** FormSummary input from the error map, in field order. */
export function summaryErrors(errors: FormErrors): FieldError[] {
  return [
    errors.host ? { name: 'host', message: errors.host } : null,
    errors.token ? { name: 'token', message: errors.token } : null
  ].filter((error): error is FieldError => error !== null)
}

/** Which providers to try for an origin: the known SaaS one, else probe both. */
export function candidateProviders(saas: ProviderId | null): ProviderId[] {
  return saas ? [saas] : ['github', 'gitlab']
}

/** Display label fallback: the user's label, else the bare host. */
export function accountLabel(label: string, origin: string): string {
  return label.trim() || origin.replace(/^https?:\/\//, '')
}
