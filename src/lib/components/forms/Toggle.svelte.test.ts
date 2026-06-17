import { render } from 'vitest-browser-svelte'
import Toggle from './Toggle.svelte'

describe('Toggle', () => {
  test('renders a labelled switch reflecting checked', () => {
    const screen = render(Toggle, {
      props: { checked: true, label: 'Notify on recovery', onchange: () => {} }
    })
    const button = screen.container.querySelector('button')!
    expect(button.getAttribute('role')).toBe('switch')
    expect(button.getAttribute('aria-checked')).toBe('true')
    expect(button.getAttribute('aria-label')).toBe('Notify on recovery')
  })

  test('click emits the negated state', () => {
    const onchange = vi.fn()
    const screen = render(Toggle, { props: { checked: false, label: 'x', onchange } })
    screen.container.querySelector('button')!.click()
    expect(onchange).toHaveBeenCalledWith(true)
  })
})
