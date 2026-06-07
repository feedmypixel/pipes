import { decideAction } from './poll'

test('first sight seeds silently (no storm when adding an already-red repo)', () => {
  expect(decideAction(undefined, 'failed', true)).toBe(null)
})

test('unchanged status stays quiet on re-poll', () => {
  expect(decideAction('failed', 'failed', true)).toBe(null)
})

test('a transition into failed announces', () => {
  expect(decideAction('running', 'failed', true)).toBe('fail')
  expect(decideAction('success', 'failed', true)).toBe('fail')
})

test('recovery only fires from a previous failure', () => {
  expect(decideAction('failed', 'success', true)).toBe('recover')
  expect(decideAction('running', 'success', true)).toBe(null)
})

test('recovery suppressed when notifyOnSuccess is off', () => {
  expect(decideAction('failed', 'success', false)).toBe(null)
})

test('transition into a non-terminal state is quiet', () => {
  expect(decideAction('pending', 'running', true)).toBe(null)
})

test('canceled is terminal but not announced', () => {
  expect(decideAction('running', 'canceled', true)).toBe(null)
})
