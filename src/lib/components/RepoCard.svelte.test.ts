import { render } from 'vitest-browser-svelte'
import RepoCard from './RepoCard.svelte'
import { ALL_BRANCH_STATES, type RepoView } from '../group'

const noPipelinesView: RepoView = {
  repo: { id: 'o/new', accountId: 'a', name: 'o/new', defaultBranch: 'main', webUrl: 'https://x' },
  displayName: 'new',
  default: null,
  polled: true,
  changes: []
}

describe('RepoCard', () => {
  test('a repo with no pipelines yet says so instead of rendering nothing', async () => {
    const screen = await render(RepoCard, {
      props: { view: noPipelinesView, allowed: ALL_BRANCH_STATES }
    })
    await expect.element(screen.getByText('No pipelines yet')).toBeVisible()
  })
})
