import { render } from 'vitest-browser-svelte'
import Stepper from './Stepper.svelte'

const base = {
  min: 0.5,
  step: 0.5,
  unit: 'min',
  decLabel: 'Less often',
  incLabel: 'More often',
  onchange: () => {}
}

describe('Stepper', () => {
  test('shows the value and unit', () => {
    const screen = render(Stepper, { props: { ...base, value: 2 } })
    expect(screen.container.textContent).toContain('2')
    expect(screen.container.textContent).toContain('min')
  })

  test('increments by step', () => {
    const onchange = vi.fn()
    const screen = render(Stepper, { props: { ...base, value: 1, onchange } })
    screen.container.querySelector<HTMLButtonElement>('[aria-label="More often"]')!.click()
    expect(onchange).toHaveBeenCalledWith(1.5)
  })

  test('decrement clamps at min', () => {
    const onchange = vi.fn()
    const screen = render(Stepper, { props: { ...base, value: 0.5, onchange } })
    screen.container.querySelector<HTMLButtonElement>('[aria-label="Less often"]')!.click()
    expect(onchange).toHaveBeenCalledWith(0.5)
  })
})
