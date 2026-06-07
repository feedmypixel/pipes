import { render } from 'vitest-browser-svelte'
import StatusIcon from './StatusIcon.svelte'

describe('StatusIcon', () => {
  test('exposes the polished status word as its accessible name', () => {
    const screen = render(StatusIcon, { props: { status: 'success' } })
    const icon = screen.container.querySelector('.status')
    expect(icon?.getAttribute('role')).toBe('img')
    expect(icon?.getAttribute('aria-label')).toBe('passed')
  })

  test('spins only while running', () => {
    const running = render(StatusIcon, { props: { status: 'running' } })
    expect(running.container.querySelector('.status')?.classList.contains('spin')).toBe(true)

    const failed = render(StatusIcon, { props: { status: 'failed' } })
    expect(failed.container.querySelector('.status')?.classList.contains('spin')).toBe(false)
  })

  test('scales the circle to the size prop', () => {
    const screen = render(StatusIcon, { props: { status: 'unknown', size: 32 } })
    const style = screen.container.querySelector('.status')?.getAttribute('style')
    expect(style).toContain('--size: 32px')
  })
})
