import type { PipelineStatus } from '../../providers/types'

export type StatusSymbol = 'check' | 'cross' | 'arc' | 'pause' | 'slash' | 'chevrons' | 'question'

export interface StatusVisual {
  /** CSS custom-property reference for the circle fill. */
  colour: string
  symbol: StatusSymbol
  /** Word shown in the title/aria-label, never inline. */
  label: string
}

const VISUALS: Record<PipelineStatus, StatusVisual> = {
  success: { colour: 'var(--success)', symbol: 'check', label: 'passed' },
  failed: { colour: 'var(--failed)', symbol: 'cross', label: 'failed' },
  running: { colour: 'var(--running)', symbol: 'arc', label: 'running' },
  pending: { colour: 'var(--pending)', symbol: 'pause', label: 'pending' },
  canceled: { colour: 'var(--neutral)', symbol: 'slash', label: 'canceled' },
  skipped: { colour: 'var(--neutral)', symbol: 'chevrons', label: 'skipped' },
  unknown: { colour: 'var(--neutral)', symbol: 'question', label: 'unknown' }
}

export function statusVisual(status: PipelineStatus): StatusVisual {
  return VISUALS[status]
}
