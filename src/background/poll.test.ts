import { decideAction } from './poll'
import type { Pipeline, PipelineStatus } from '../providers/types'

function pipeline(status: PipelineStatus, isDefaultBranch = false): Pipeline {
  return {
    id: '1',
    ref: isDefaultBranch ? 'main' : 'feature',
    isDefaultBranch,
    status,
    webUrl: 'https://example.test/p/1',
    sha: 'abc',
    title: 'test',
    updatedAt: '2026-06-05T00:00:00Z'
  }
}

test('first sight seeds silently (no storm when adding an already-red repo)', () => {
  expect(decideAction(undefined, pipeline('failed', true), true)).toBe(null)
})

test('unchanged status stays quiet on re-poll', () => {
  expect(decideAction(pipeline('failed', true), pipeline('failed', true), true)).toBe(null)
})

test('default-branch failure is loud', () => {
  expect(decideAction(pipeline('running', true), pipeline('failed', true), true)).toBe('main-fail')
})

test('non-default-branch failure is a normal toast', () => {
  expect(decideAction(pipeline('success'), pipeline('failed'), true)).toBe('branch-fail')
})

test('recovery only fires from a previous failure', () => {
  expect(decideAction(pipeline('failed', true), pipeline('success', true), true)).toBe('recover')
  expect(decideAction(pipeline('running', true), pipeline('success', true), true)).toBe(null)
})

test('recovery suppressed when notifyOnSuccess is off', () => {
  expect(decideAction(pipeline('failed', true), pipeline('success', true), false)).toBe(null)
})

test('transition into a non-terminal state is quiet', () => {
  expect(decideAction(pipeline('pending', true), pipeline('running', true), true)).toBe(null)
})

test('canceled is terminal but not announced', () => {
  expect(decideAction(pipeline('running', true), pipeline('canceled', true), true)).toBe(null)
})
