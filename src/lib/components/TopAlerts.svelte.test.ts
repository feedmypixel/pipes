import { render } from 'vitest-browser-svelte'
import TopAlerts from './TopAlerts.svelte'

const base = {
  connectionIssues: [],
  rateLimited: [],
  mainFailing: 0,
  ready: true,
  onOpenSettings: () => {}
}

describe('TopAlerts', () => {
  test('failure alarm is assertive and pluralises the branch count', () => {
    const one = render(TopAlerts, { props: { ...base, mainFailing: 1 } })
    const alarm = one.container.querySelector('.alarm')
    expect(alarm?.getAttribute('role')).toBe('alert')
    expect(alarm?.textContent).toContain('1 default branch failing')

    const many = render(TopAlerts, { props: { ...base, mainFailing: 3 } })
    expect(many.container.querySelector('.alarm')?.textContent).toContain(
      '3 default branches failing'
    )
  })

  test('all-clear is a polite status, only once ready and nothing failing', () => {
    const ready = render(TopAlerts, { props: { ...base, mainFailing: 0, ready: true } })
    expect(ready.container.querySelector('.all-clear')?.getAttribute('role')).toBe('status')

    const notReady = render(TopAlerts, { props: { ...base, ready: false } })
    expect(notReady.container.querySelector('.all-clear')).toBeNull()
  })

  test('rate-limited accounts announce politely and never alongside all-clear', () => {
    const screen = render(TopAlerts, {
      props: {
        ...base,
        rateLimited: [{ id: 'gh', label: 'GitHub', resumesAt: 9_999_999_999 }]
      }
    })
    const strip = screen.container.querySelector('.rate-limited')
    expect(strip?.getAttribute('role')).toBe('status')
    expect(strip?.textContent).toContain('GitHub rate limited')
  })

  test('connection issues render as a settings shortcut button', () => {
    const screen = render(TopAlerts, {
      props: { ...base, connectionIssues: [{ id: 'gh', label: 'GitHub', error: 'bad token' }] }
    })
    const button = screen.container.querySelector('button.issue')
    expect(button?.textContent).toContain('GitHub connection problem: bad token')
  })
})
