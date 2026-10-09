import { render } from 'vitest-browser-svelte'
import MessageIcon from './MessageIcon.svelte'

describe('MessageIcon', () => {
  test('is hidden from assistive tech', async () => {
    const screen = await render(MessageIcon, { props: { variant: 'success' } })
    expect(screen.container.querySelector('.message-icon')?.getAttribute('aria-hidden')).toBe(
      'true'
    )
  })

  test.each([
    [16, 11],
    [18, 12]
  ])('size %i gives a %i px symbol', async (size, symbol) => {
    const screen = await render(MessageIcon, { props: { variant: 'error', size } })
    const wrapper = screen.container.querySelector('.message-icon') as HTMLElement
    const svg = wrapper.querySelector('svg') as SVGElement
    expect(wrapper.getBoundingClientRect().width).toBe(size)
    expect(svg.getBoundingClientRect().width).toBe(symbol)
  })

  test('warning has no circle and fills the full size', async () => {
    const screen = await render(MessageIcon, { props: { variant: 'warning', size: 16 } })
    const wrapper = screen.container.querySelector('.message-icon') as HTMLElement
    const svg = wrapper.querySelector('svg') as SVGElement
    expect(getComputedStyle(wrapper).backgroundColor).toBe('rgba(0, 0, 0, 0)')
    expect(svg.getBoundingClientRect().width).toBe(16)
  })

  test('token-bad uses the failed circle', async () => {
    const screen = await render(MessageIcon, { props: { variant: 'token-bad' } })
    const wrapper = screen.container.querySelector('.message-icon') as HTMLElement
    expect(wrapper.style.getPropertyValue('--circle')).toBe('var(--failed)')
  })
})
