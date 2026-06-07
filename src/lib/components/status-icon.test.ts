import { statusVisual } from './status-icon'

test('maps terminal + in-flight statuses to colour, symbol, label', () => {
  expect(statusVisual('success')).toEqual({
    colour: 'var(--success)',
    symbol: 'check',
    label: 'passed'
  })
  expect(statusVisual('failed')).toEqual({
    colour: 'var(--failed)',
    symbol: 'cross',
    label: 'failed'
  })
  expect(statusVisual('running')).toEqual({
    colour: 'var(--running)',
    symbol: 'arc',
    label: 'running'
  })
  expect(statusVisual('pending')).toEqual({
    colour: 'var(--pending)',
    symbol: 'pause',
    label: 'pending'
  })
})

test('canceled is neutral; skipped is the ink invert, each with its own symbol', () => {
  expect(statusVisual('canceled').colour).toBe('var(--neutral)')
  expect(statusVisual('canceled').symbol).toBe('slash')
  expect(statusVisual('skipped').colour).toBe('var(--text)')
  expect(statusVisual('skipped').ink).toBe('var(--bg)')
  expect(statusVisual('skipped').symbol).toBe('chevrons')
})

test('unknown is a purple question mark', () => {
  expect(statusVisual('unknown').colour).toBe('var(--unknown)')
  expect(statusVisual('unknown').symbol).toBe('question')
})
