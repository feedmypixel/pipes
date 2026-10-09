import { render } from 'vitest-browser-svelte'
import TopAlerts from './TopAlerts.svelte'

const base = {
  connectionIssues: [],
  rateLimited: [],
  mainFailing: 0,
  ready: true,
  onOpenSettings: () => {},
  onReplaceToken: () => {}
}

describe('TopAlerts', () => {
  test('failure alarm is assertive and pluralises the branch count', async () => {
    const one = await render(TopAlerts, { props: { ...base, mainFailing: 1 } })
    const alarm = one.container.querySelector('.alarm')
    expect(alarm?.getAttribute('role')).toBe('alert')
    expect(alarm?.textContent).toContain('1 default branch failing')

    const many = await render(TopAlerts, { props: { ...base, mainFailing: 3 } })
    expect(many.container.querySelector('.alarm')?.textContent).toContain(
      '3 default branches failing'
    )
  })

  test('all-clear is a polite status, only once ready and nothing failing', async () => {
    const ready = await render(TopAlerts, { props: { ...base, mainFailing: 0, ready: true } })
    expect(ready.container.querySelector('.all-clear')?.getAttribute('role')).toBe('status')

    const notReady = await render(TopAlerts, { props: { ...base, ready: false } })
    expect(notReady.container.querySelector('.all-clear')).toBeNull()
  })

  test('rate-limited accounts announce politely and never alongside all-clear', async () => {
    const screen = await render(TopAlerts, {
      props: {
        ...base,
        rateLimited: [{ id: 'gh', label: 'GitHub', resumesAt: 9_999_999_999 }]
      }
    })
    const strip = screen.container.querySelector('.rate-limited')
    expect(strip?.getAttribute('role')).toBe('status')
    expect(strip?.textContent).toContain('GitHub rate limited')
  })

  test('connection issues render as a settings shortcut button', async () => {
    let opened = 0
    const screen = await render(TopAlerts, {
      props: {
        ...base,
        onOpenSettings: () => opened++,
        connectionIssues: [
          { id: 'gh', label: 'GitHub', error: 'network down', tokenFailure: false }
        ]
      }
    })
    const button = screen.container.querySelector('button.issue') as HTMLButtonElement
    expect(button.textContent).toContain('GitHub connection problem: network down')
    expect(screen.container.querySelector('.issue-link')).toBeNull()
    button.click()
    expect(opened).toBe(1)
  })

  test('a rejected token is a status strip with its own Replace token action', async () => {
    const replaced: string[] = []
    const screen = await render(TopAlerts, {
      props: {
        ...base,
        onReplaceToken: (id: string) => replaced.push(id),
        connectionIssues: [{ id: 'gh', label: 'work', error: 'HTTP 401', tokenFailure: true }]
      }
    })
    const strip = screen.container.querySelector('.issue')
    expect(strip?.tagName).toBe('DIV')
    expect(strip?.getAttribute('role')).toBe('status')
    expect(strip?.textContent).toContain('work connection problem: HTTP 401')
    await screen.getByRole('button', { name: 'Replace token for work' }).click()
    expect(replaced).toEqual(['gh'])
  })
})
