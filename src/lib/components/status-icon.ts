import type { PipelineStatus } from '../../providers/types'

export type StatusSymbol = 'check' | 'cross' | 'arc' | 'pause' | 'slash' | 'chevrons' | 'question'

export interface StatusVisual {
  /** CSS custom-property reference for the circle fill. */
  colour: string
  /** Glyph colour. Defaults to --status-ink (white on a saturated fill). */
  ink?: string
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
  // Ink circle (flips black/near-white per theme) with a glyph in the surface colour, so it
  // reads as "black" in light + stays visible in dark — distinct from the others.
  skipped: { colour: 'var(--text)', ink: 'var(--bg)', symbol: 'chevrons', label: 'skipped' },
  unknown: { colour: 'var(--unknown)', symbol: 'question', label: 'unknown' }
}

export function statusVisual(status: PipelineStatus): StatusVisual {
  return VISUALS[status]
}
