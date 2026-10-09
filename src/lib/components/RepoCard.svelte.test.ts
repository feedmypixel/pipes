import { render } from 'vitest-browser-svelte'
import RepoCard from './RepoCard.svelte'
import { ALL_BRANCH_STATES, type RepoView } from '../group'
import type { Change, PipelineStatus } from '../../providers/types'

function change(number: number, status: PipelineStatus): Change {
  return {
    number,
    title: `PR ${number}`,
    headRef: `f${number}`,
    headSha: `s${number}`,
    status,
    webUrl: `https://example.test/pull/${number}`,
    isDraft: false,
    isBot: false,
    attribution: { login: 'me' }
  }
}

function view(overrides: Partial<RepoView> = {}): RepoView {
  return {
    repo: { id: 'o/r', accountId: 'a', name: 'o/r', defaultBranch: 'main', webUrl: 'https://x' },
    displayName: 'r',
    providerId: 'github',
    default: null,
    polled: true,
    changes: [],
    ...overrides
  }
}

describe('RepoCard', () => {
  test('a repo with no pipelines yet says so instead of rendering nothing', async () => {
    const screen = await render(RepoCard, { props: { view: view(), allowed: ALL_BRANCH_STATES } })
    await expect.element(screen.getByText('No pipelines yet')).toBeVisible()
  })

  test('open PRs make the header a toggle that reports clicks', async () => {
    let toggles = 0
    const screen = await render(RepoCard, {
      props: {
        view: view({ changes: [change(1, 'success')] }),
        allowed: ALL_BRANCH_STATES,
        onToggle: () => toggles++
      }
    })
    const toggle = screen.container.querySelector('button.repo-toggle') as HTMLButtonElement
    expect(toggle.getAttribute('aria-expanded')).toBe('true')
    toggle.click()
    expect(toggles).toBe(1)
  })

  test('collapsed hides the PR rows but keeps the PR count', async () => {
    const screen = await render(RepoCard, {
      props: {
        view: view({ changes: [change(1, 'success'), change(2, 'success')] }),
        allowed: ALL_BRANCH_STATES,
        collapsed: true,
        onToggle: () => {}
      }
    })
    expect(screen.container.querySelectorAll('.row')).toHaveLength(0)
    expect(screen.container.querySelector('.pr-count')?.textContent?.trim()).toBe('2')
  })

  test('the failing badge counts failed PRs', async () => {
    const screen = await render(RepoCard, {
      props: {
        view: view({ changes: [change(1, 'failed'), change(2, 'failed'), change(3, 'success')] }),
        allowed: ALL_BRANCH_STATES
      }
    })
    expect(screen.container.querySelector('.fail-badge')?.textContent).toBe('2')
  })
})
