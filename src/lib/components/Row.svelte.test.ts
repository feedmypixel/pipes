import { render } from 'vitest-browser-svelte'
import Row from './Row.svelte'
import type { Pipeline } from '../../providers/types'

function pipeline(overrides: Partial<Pipeline> = {}): Pipeline {
  return {
    id: '1',
    ref: 'main',
    isDefaultBranch: true,
    status: 'success',
    webUrl: 'https://example.test/run/1',
    sha: 'abc123',
    title: 'CI',
    updatedAt: '2026-06-01T10:00:00Z',
    ...overrides
  }
}

describe('Row', () => {
  test('links to the run and shows the ref', () => {
    const screen = render(Row, { props: { pipeline: pipeline() } })
    const link = screen.container.querySelector('a.r-link') as HTMLAnchorElement
    expect(link.href).toBe('https://example.test/run/1')
    expect(screen.container.querySelector('.name')?.textContent).toBe('main')
  })

  test('accessible name uses the polished status word + flags the default branch', () => {
    const screen = render(Row, {
      props: { pipeline: pipeline({ ref: 'main', status: 'success' }) }
    })
    expect(screen.container.querySelector('a.r-link')?.getAttribute('aria-label')).toBe(
      'main (default branch), passed'
    )
  })

  test('non-default branch omits the default-branch note', () => {
    const screen = render(Row, {
      props: { pipeline: pipeline({ ref: 'feature', isDefaultBranch: false, status: 'failed' }) }
    })
    expect(screen.container.querySelector('a.r-link')?.getAttribute('aria-label')).toBe(
      'feature, failed'
    )
  })

  test('reflects status as a data attribute for the status stripe', () => {
    const screen = render(Row, { props: { pipeline: pipeline({ status: 'failed' }) } })
    expect(screen.container.querySelector('.row')?.getAttribute('data-status')).toBe('failed')
  })

  test('shows the author avatar + login when attributed', () => {
    const screen = render(Row, {
      props: {
        pipeline: pipeline({
          attribution: { login: 'pusher', profileUrl: 'https://github.com/pusher' }
        })
      }
    })
    const author = screen.container.querySelector('a.author') as HTMLAnchorElement
    expect(author.getAttribute('href')).toBe('https://github.com/pusher')
    expect(screen.container.querySelector('.author-name')?.textContent).toBe('pusher')
  })
})
