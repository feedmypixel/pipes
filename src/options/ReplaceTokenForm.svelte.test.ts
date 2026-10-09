import { render } from 'vitest-browser-svelte'
import { RateLimitError } from '../providers/http'
import ReplaceTokenForm from './ReplaceTokenForm.svelte'
import type { Account } from '../providers/types'

const { validateToken } = vi.hoisted(() => ({ validateToken: vi.fn() }))

vi.mock('../providers', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../providers')>()),
  getProvider: () => ({ validateToken })
}))

const account: Account = {
  id: 'gh',
  provider: 'github',
  label: 'work',
  host: 'https://github.com',
  token: 'old',
  user: 'ben'
}

async function setup(overrides = {}) {
  const onSave = vi.fn().mockResolvedValue(undefined)
  const onCancel = vi.fn()
  const onAddAsNew = vi.fn()
  const screen = await render(ReplaceTokenForm, {
    props: { account, onSave, onCancel, onAddAsNew, ...overrides }
  })
  const field = screen.getByLabelText('New personal access token')
  const text = () => screen.container.textContent
  return { screen, field, text, onSave, onCancel, onAddAsNew }
}

beforeEach(() => {
  validateToken.mockReset()
})

describe('ReplaceTokenForm', () => {
  test('focuses the token field on mount and labels the form', async () => {
    const { screen } = await setup()
    expect(document.activeElement?.id).toBe('token-gh')
    expect(screen.getByRole('form', { name: 'Replace token for work' })).toBeInTheDocument()
  })

  test('hints the required login, omitted for a legacy account', async () => {
    const withUser = await setup()
    expect(withUser.text()).toContain('Must sign in as @ben')
    const legacy = await setup({ account: { ...account, user: undefined } })
    expect(legacy.text()).not.toContain('Must sign in as')
  })

  test('validate with an empty token shows the field error but no summary', async () => {
    const { screen, text } = await setup()
    await screen.getByRole('button', { name: 'Validate' }).click()
    expect(text()).toContain('Enter a token')
    expect(screen.container.querySelector('[role="alert"]')).toBeNull()
    expect(validateToken).not.toHaveBeenCalled()
  })

  test('save with an empty token shows summary and field error without saving', async () => {
    const { screen, text, onSave } = await setup()
    await screen.getByRole('button', { name: 'Save token' }).click()
    expect(screen.container.querySelector('[role="alert"] ul')).not.toBeNull()
    expect(text()).toContain('Enter a token')
    expect(screen.container.querySelector('.field-error')?.textContent).toBe('Enter a token')
    expect(onSave).not.toHaveBeenCalled()
  })

  test('the field error clears once a value is typed', async () => {
    const { screen, field } = await setup()
    await screen.getByRole('button', { name: 'Save token' }).click()
    expect(screen.container.querySelector('.field-error')).not.toBeNull()
    await field.fill('abc')
    expect(screen.container.querySelector('.field-error')).toBeNull()
    expect(screen.container.querySelector('[role="alert"]')).toBeNull()
  })

  test('validate ok reports who the token signs in as', async () => {
    validateToken.mockResolvedValue({ ok: true, user: 'ben' })
    const { screen, field, text } = await setup()
    await field.fill('new-token')
    await screen.getByRole('button', { name: 'Validate' }).click()
    await expect.poll(text).toContain('Signed in as @ben')
  })

  test('a rejected token shows the banner and does not save', async () => {
    validateToken.mockResolvedValue({ ok: false, error: 'HTTP 401 Unauthorized', status: 401 })
    const { screen, field, onSave } = await setup()
    await field.fill('bad')
    await screen.getByRole('button', { name: 'Save token' }).click()
    const banner = screen.container.querySelector('[role="alert"]')
    await expect.poll(() => banner?.textContent).toContain('Couldn’t replace token.')
    expect(banner?.textContent).toContain('GitHub returned HTTP 401')
    expect(screen.container.querySelector('.below')?.textContent).toBe(
      'Could not validate, check the token and its permissions'
    )
    expect(onSave).not.toHaveBeenCalled()
  })

  test('a different login offers to add it as a new connection', async () => {
    validateToken.mockResolvedValue({ ok: true, user: 'someone' })
    const { screen, field, text, onSave, onAddAsNew } = await setup()
    await field.fill('other-token')
    await screen.getByRole('button', { name: 'Save token' }).click()
    await expect.poll(text).toContain('It signs in as @someone, not @ben')
    expect(onSave).not.toHaveBeenCalled()
    await screen.getByRole('link', { name: 'Add it as a new connection instead' }).click()
    expect(onAddAsNew).toHaveBeenCalledWith('other-token')
    expect(onSave).not.toHaveBeenCalled()
  })

  test('a valid token for the same account is saved with its user', async () => {
    validateToken.mockResolvedValue({ ok: true, user: 'ben' })
    const { screen, field, onSave } = await setup()
    await field.fill('good-token')
    await screen.getByRole('button', { name: 'Save token' }).click()
    await expect.poll(() => onSave.mock.calls).toEqual([['good-token', 'ben']])
  })

  test('a rate limit is reported in the banner', async () => {
    validateToken.mockRejectedValue(new RateLimitError(0))
    const { screen, field, text } = await setup()
    await field.fill('token')
    await screen.getByRole('button', { name: 'Save token' }).click()
    await expect.poll(text).toContain('Rate limited, try again in a few minutes')
  })

  test('Escape inside the form and the Cancel button both cancel', async () => {
    const { screen, field, onCancel } = await setup()
    await field
      .element()
      .dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    expect(onCancel).toHaveBeenCalledTimes(1)
    await screen.getByRole('button', { name: 'Cancel' }).click()
    expect(onCancel).toHaveBeenCalledTimes(2)
  })
})
