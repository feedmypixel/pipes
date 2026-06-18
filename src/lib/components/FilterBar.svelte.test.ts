import { render } from 'vitest-browser-svelte'
import { SvelteSet } from 'svelte/reactivity'
import FilterBar from './FilterBar.svelte'
import { ALL_BRANCH_STATES, BRANCH_STATE_ORDER } from '../group'
import type { PipelineStatus } from '../../providers/types'

const STATE_COUNT = BRANCH_STATE_ORDER.length

const allStates = () => new SvelteSet<PipelineStatus>([...ALL_BRANCH_STATES])
const chip = (screen: { container: Element }, label: string) =>
  [...screen.container.querySelectorAll('.chip')].find(
    (c) => c.textContent?.trim() === label
  ) as HTMLButtonElement

describe('FilterBar', () => {
  test('renders a status chip per branch state, pressed when allowed', () => {
    const screen = render(FilterBar, { props: { allowed: allStates() } })
    const chips = screen.container.querySelectorAll('.chip')
    expect(chips.length).toBe(STATE_COUNT)
    expect([...chips].every((c) => c.getAttribute('aria-pressed') === 'true')).toBe(true)
  })

  test('clicking a chip toggles its state in the shared set', () => {
    const allowed = allStates()
    const screen = render(FilterBar, { props: { allowed } })
    chip(screen, 'failed').click()
    expect(allowed.has('failed')).toBe(false)
    chip(screen, 'failed').click()
    expect(allowed.has('failed')).toBe(true)
  })

  test('toggle-all clears then selects every state', () => {
    const allowed = allStates()
    const screen = render(FilterBar, { props: { allowed } })
    const toggle = screen.container.querySelector('.toggle-all') as HTMLButtonElement
    expect(toggle.textContent?.trim()).toBe('Clear all') // all on → offers Clear
    toggle.click()
    expect(allowed.size).toBe(0)
    toggle.click()
    expect(allowed.size).toBe(STATE_COUNT)
  })
})
