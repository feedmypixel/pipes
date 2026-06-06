import { render } from 'vitest-browser-svelte'
import FormSummary from './FormSummary.svelte'

describe('FormSummary', () => {
  test('renders nothing when there are no errors', () => {
    const screen = render(FormSummary, { props: { errors: [] } })
    expect(screen.container.querySelector('.form-summary')).toBeNull()
  })

  test('announces the problems with an in-page anchor per field', async () => {
    const screen = render(FormSummary, {
      props: {
        errors: [
          { name: 'host', message: 'Enter a host' },
          { name: 'token', message: 'Enter a token' }
        ]
      }
    })
    const wrapper = screen.container.querySelector('.form-summary')
    expect(wrapper?.getAttribute('role')).toBe('alert')
    await expect.element(screen.getByText(/There's a problem/)).toBeVisible()

    const links = Array.from(wrapper!.querySelectorAll('a')) as HTMLAnchorElement[]
    expect(links.map((a) => a.getAttribute('href'))).toEqual(['#host', '#token'])
    expect(links.map((a) => a.textContent)).toEqual(['Enter a host', 'Enter a token'])
  })
})
