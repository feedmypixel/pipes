import { render } from 'vitest-browser-svelte'
import ChangeRow from './ChangeRow.svelte'
import type { Change } from '../../providers/types'

function change(overrides: Partial<Change> = {}): Change {
  return {
    number: 42,
    title: 'Add widget',
    headRef: 'feature/widget',
    headSha: 'def456',
    status: 'running',
    updatedAt: '2026-06-01T10:00:00Z',
    webUrl: 'https://example.test/pull/42',
    isDraft: false,
    isBot: false,
    author: 'me',
    ...overrides
  }
}

describe('ChangeRow', () => {
  test('shows the number, title and head branch, linking to the PR/MR', () => {
    const screen = render(ChangeRow, { props: { change: change() } })
    const link = screen.container.querySelector('a.row') as HTMLAnchorElement
    expect(link.href).toBe('https://example.test/pull/42')
    expect(screen.container.querySelector('.number')?.textContent).toBe('#42')
    expect(screen.container.querySelector('.name')?.textContent).toBe('Add widget')
    expect(screen.container.querySelector('.branch-name')?.textContent).toBe('feature/widget')
  })

  test('accessible name carries number, title, branch and polished status', () => {
    const screen = render(ChangeRow, { props: { change: change({ status: 'success' }) } })
    expect(screen.container.querySelector('a.row')?.getAttribute('aria-label')).toBe(
      '#42 Add widget on feature/widget, passed'
    )
  })

  test('drafts are dimmed and announced', () => {
    const screen = render(ChangeRow, { props: { change: change({ isDraft: true }) } })
    const link = screen.container.querySelector('a.row')
    expect(link?.classList.contains('draft')).toBe(true)
    expect(link?.getAttribute('aria-label')).toContain(', draft')
  })
})
