import { render } from 'vitest-browser-svelte'
import Fixture from './field-fixture.svelte'

describe('Input (wired through Field context)', () => {
  test('takes its id from the field name and links the hint', () => {
    const screen = render(Fixture, { props: { name: 'host', label: 'Host', hint: 'github.com' } })
    const input = screen.container.querySelector('input')!
    expect(input.id).toBe('host')
    expect(input.getAttribute('aria-describedby')).toBe('host-hint')
    expect(input.getAttribute('aria-invalid')).toBeNull()
  })

  test('chains hint + error ids and sets aria-invalid when errored', () => {
    const screen = render(Fixture, {
      props: { name: 'host', label: 'Host', hint: 'github.com', error: 'Enter a host' }
    })
    const input = screen.container.querySelector('input')!
    expect(input.getAttribute('aria-invalid')).toBe('true')
    expect(input.getAttribute('aria-describedby')).toBe('host-hint host-error')
  })
})
