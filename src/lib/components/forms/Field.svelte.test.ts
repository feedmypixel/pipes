import { render } from 'vitest-browser-svelte'
import { createRawSnippet } from 'svelte'
import Field from './Field.svelte'

const inputSnippet = createRawSnippet(() => ({
  render: () => `<input class="inp" type="text" />`
}))

describe('Field', () => {
  test('renders the label tied to the field name', async () => {
    const screen = render(Field, { props: { name: 'host', label: 'Host', children: inputSnippet } })
    await expect.element(screen.getByText('Host')).toBeVisible()
    expect(screen.container.querySelector('label')?.getAttribute('for')).toBe('host')
  })

  test('marks optional fields with an (optional) tag', () => {
    const screen = render(Field, {
      props: { name: 'label', label: 'Label', optional: true, children: inputSnippet }
    })
    expect(screen.container.querySelector('.optional-tag')?.textContent).toContain('optional')
  })

  test('renders the hint with an id for aria-describedby', () => {
    const screen = render(Field, {
      props: { name: 'host', label: 'Host', hint: 'github.com', children: inputSnippet }
    })
    const hint = screen.container.querySelector('.hint')
    expect(hint?.id).toBe('host-hint')
    expect(hint?.textContent).toBe('github.com')
  })

  test('shows the error above the input, with has-error and an error id', () => {
    const screen = render(Field, {
      props: { name: 'host', label: 'Host', error: 'Enter a host', children: inputSnippet }
    })
    const field = screen.container.querySelector('.field')!
    expect(field.classList.contains('has-error')).toBe(true)

    const error = screen.container.querySelector('.field-error')!
    expect(error.id).toBe('host-error')
    expect(error.textContent).toBe('Enter a host')

    // The error precedes the input in DOM order so a screen reader hits it first.
    const children = Array.from(field.children)
    expect(children.indexOf(error)).toBeLessThan(
      children.indexOf(screen.container.querySelector('.inp')!)
    )
  })

  test.each(['busy', 'ok', 'bad'] as const)('renders the %s below state', (state) => {
    const screen = render(Field, {
      props: {
        name: 'host',
        label: 'Host',
        below: { state, text: 'message' },
        children: inputSnippet
      }
    })
    const below = screen.container.querySelector('.below')
    expect(below?.classList.contains(state)).toBe(true)
    expect(below?.textContent).toContain('message')
  })
})
