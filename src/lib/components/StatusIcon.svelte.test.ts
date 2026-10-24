import { render } from 'vitest-browser-svelte'
import StatusIcon from './StatusIcon.svelte'

describe('StatusIcon', () => {
  test('exposes the polished status word as its accessible name', async () => {
    const screen = await render(StatusIcon, { props: { status: 'success' } })
    const icon = screen.container.querySelector('.status')
    expect(icon?.getAttribute('role')).toBe('img')
    expect(icon?.getAttribute('aria-label')).toBe('passed')
  })

  test('spins only while running', async () => {
    const running = await render(StatusIcon, { props: { status: 'running' } })
    expect(running.container.querySelector('.status')?.classList.contains('spin')).toBe(true)

    const failed = await render(StatusIcon, { props: { status: 'failed' } })
    expect(failed.container.querySelector('.status')?.classList.contains('spin')).toBe(false)
  })

  test('no pipelines is a hollow --neutral ring with no glyph, labelled', async () => {
    document.documentElement.style.setProperty('--neutral', 'rgb(1, 2, 3)')
    onTestFinished(() => {
      document.documentElement.style.removeProperty('--neutral')
    })
    const screen = await render(StatusIcon, { props: { status: null, size: 16 } })
    const icon = screen.container.querySelector('.status') as HTMLElement
    expect(icon.classList.contains('none')).toBe(true)
    expect(icon.getAttribute('aria-label')).toBe('no pipelines')
    expect(icon.querySelector('svg')).toBeNull()
    const style = getComputedStyle(icon)
    expect(style.backgroundColor).toBe('rgba(0, 0, 0, 0)')
    expect(style.boxShadow).toBe('rgb(1, 2, 3) 0px 0px 0px 1.5px inset')
  })

  test('scales the circle to the size prop', async () => {
    const screen = await render(StatusIcon, { props: { status: 'unknown', size: 32 } })
    const style = screen.container.querySelector('.status')?.getAttribute('style')
    expect(style).toContain('--size: 32px')
  })
})
