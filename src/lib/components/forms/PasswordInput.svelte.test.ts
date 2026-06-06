import { render } from 'vitest-browser-svelte'
import Fixture from './field-fixture.svelte'

describe('PasswordInput', () => {
  test('hides the value by default and reveals it via the Show toggle', async () => {
    const screen = render(Fixture, { props: { name: 'token', label: 'Token', password: true } })
    const input = screen.container.querySelector('input')!
    expect(input.type).toBe('password')

    await screen.getByRole('button', { name: 'Show' }).click()
    expect(input.type).toBe('text')
    await expect.element(screen.getByRole('button', { name: 'Hide' })).toBeVisible()
  })

  test('inherits the field id and aria wiring', () => {
    const screen = render(Fixture, { props: { name: 'token', label: 'Token', password: true } })
    expect(screen.container.querySelector('input')?.id).toBe('token')
  })
})
