import { render } from 'vitest-browser-svelte'
import ConnectionRow from './ConnectionRow.svelte'
import type { Account } from '../providers/types'

const account: Account = {
  id: 'gh',
  provider: 'github',
  label: 'work',
  host: 'https://github.com',
  token: 'secret',
  user: 'ben'
}

async function setup(overrides = {}) {
  const handlers = {
    onOpen: vi.fn(),
    onClose: vi.fn(),
    onReplace: vi.fn().mockResolvedValue(undefined),
    onAddAsNew: vi.fn(),
    onRemove: vi.fn(),
    onFlashEnd: vi.fn()
  }
  const screen = await render(ConnectionRow, {
    props: {
      account,
      health: { ok: true },
      watchedCount: 4,
      open: false,
      replaced: false,
      flash: false,
      ...handlers,
      ...overrides
    }
  })
  const row = screen.container.querySelector('li') as HTMLLIElement
  const note = () => screen.container.querySelector('.connection-note')
  return { screen, row, note, ...handlers }
}

const rejected = { ok: false, status: 401, error: 'x' }

describe('ConnectionRow', () => {
  test('a healthy connection says token saved, with no failing state or note', async () => {
    const { row, note } = await setup()
    expect(row.textContent).toContain('token saved')
    expect(row.classList.contains('failing')).toBe(false)
    expect(note()).toBeNull()
  })

  test('a just-replaced healthy connection says token replaced', async () => {
    const { row } = await setup({ replaced: true })
    expect(row.textContent).toContain('token replaced')
  })

  test('a rejected token is failing and explains the paused repos', async () => {
    const { row, note } = await setup({ health: rejected })
    expect(row.classList.contains('failing')).toBe(true)
    expect(row.textContent).toContain('token rejected')
    expect(note()?.textContent?.replace(/\s+/g, ' ').trim()).toBe(
      'GitHub returned HTTP 401. 4 watched repos are paused until you replace the token.'
    )
  })

  test('the paused note is singular for one repo', async () => {
    const { note } = await setup({ health: rejected, watchedCount: 1 })
    expect(note()?.textContent).toContain('1 watched repo is paused until you replace the token.')
  })

  test('with nothing watched the note just asks to reconnect', async () => {
    const { note } = await setup({ health: rejected, watchedCount: 0 })
    expect(note()?.textContent).toContain('Replace the token to reconnect.')
  })

  test('a non-auth failure is not a token failure', async () => {
    const { row, note } = await setup({ health: { ok: false, status: 500, error: 'boom' } })
    expect(row.classList.contains('failing')).toBe(false)
    expect(row.textContent).toContain('token saved')
    expect(note()).toBeNull()
  })

  test('the replace button is wired to the form and opens it', async () => {
    const { screen, onOpen } = await setup()
    const button = screen.getByRole('button', { name: 'Replace token for work' })
    expect(button.element().getAttribute('aria-controls')).toBe('replace-gh')
    await button.click()
    expect(onOpen).toHaveBeenCalledTimes(1)
  })

  test('when open the button and note give way to the form', async () => {
    const { screen, note } = await setup({ open: true, health: rejected })
    expect(screen.container.querySelector('button[aria-controls="replace-gh"]')).toBeNull()
    expect(screen.getByRole('form', { name: 'Replace token for work' })).toBeInTheDocument()
    expect(note()).toBeNull()
  })

  test('the remove button removes the connection', async () => {
    const { screen, onRemove } = await setup()
    await screen.getByRole('button', { name: 'Remove work connection' }).click()
    expect(onRemove).toHaveBeenCalledTimes(1)
  })

  test('cancelling the open form closes it', async () => {
    const { screen, onClose } = await setup({ open: true })
    await screen.getByRole('button', { name: 'Cancel' }).click()
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  test('flash adds the flash class', async () => {
    const { row } = await setup({ flash: true })
    expect(row.classList.contains('flash')).toBe(true)
  })
})
