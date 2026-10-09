<script lang="ts">
  import KeyRound from '@lucide/svelte/icons/key-round'
  import BadgeCheck from '@lucide/svelte/icons/badge-check'
  import { getProvider, providerName } from '../providers'
  import { RateLimitError } from '../providers/http'
  import type { Account, ValidationResult } from '../providers/types'
  import Field from '../lib/components/forms/Field.svelte'
  import PasswordInput from '../lib/components/forms/PasswordInput.svelte'
  import FormSummary from '../lib/components/forms/FormSummary.svelte'
  import Banner from '../lib/components/Banner.svelte'
  import Button from '../lib/components/Button.svelte'
  import TokenHelp from './TokenHelp.svelte'
  import { isTokenFailure } from '../lib/health'
  import { replaceOutcome, type ReplaceOutcome } from './replace-token'

  let {
    account,
    onSave,
    onCancel,
    onAddAsNew
  }: {
    account: Account
    onSave: (token: string, user: string | undefined) => Promise<void>
    onCancel: () => void
    onAddAsNew: (token: string) => void
  } = $props()

  const fieldName = $derived(`token-${account.id}`)
  const hostName = $derived(account.host.replace(/^https?:\/\//, ''))

  let token = $state('')
  let error = $state<string>()
  let showSummary = $state(false)
  let below = $state<{ state: 'busy' | 'ok' | 'bad'; text: string }>()
  let failure = $state<Exclude<ReplaceOutcome, { kind: 'ok' }>>()
  let submitting = $state(false)
  let closed = false
  let form = $state<HTMLFormElement>()

  const summaryErrors = $derived(showSummary && error ? [{ name: fieldName, message: error }] : [])

  $effect(() => {
    document.getElementById(fieldName)?.focus()
    return () => (closed = true)
  })

  function requireToken(): boolean {
    if (token.trim()) {
      return true
    }
    error = 'Enter a token'
    document.getElementById(fieldName)?.focus()
    return false
  }

  function clearErrorIfFilled() {
    if (error && token.trim()) {
      error = undefined
      showSummary = false
    }
  }

  async function check(): Promise<ReplaceOutcome> {
    below = { state: 'busy', text: 'Validating…' }
    let result: ValidationResult
    try {
      result = await getProvider(account.provider).validateToken({ ...account, token })
    } catch (thrown) {
      if (!(thrown instanceof RateLimitError)) {
        throw thrown
      }
      result = { ok: false, error: 'Rate limited, try again in a few minutes' }
    }
    const outcome = replaceOutcome(account, result)
    below =
      outcome.kind === 'ok'
        ? { state: 'ok', text: `Signed in as @${outcome.user}` }
        : outcome.kind === 'other-account'
          ? { state: 'bad', text: `Signed in as @${outcome.user}, not @${account.user}` }
          : isTokenFailure({ ok: false, status: outcome.status }) || !outcome.error
            ? { state: 'bad', text: 'Could not validate, check the token and its permissions' }
            : { state: 'bad', text: outcome.error }
    return outcome
  }

  async function validate() {
    showSummary = false
    if (requireToken()) {
      await check()
    }
  }

  async function save(event: SubmitEvent) {
    event.preventDefault()
    failure = undefined
    if (!requireToken()) {
      showSummary = true
      return
    }
    submitting = true
    const outcome = await check()
    if (closed) {
      return
    }
    if (outcome.kind !== 'ok') {
      failure = outcome
      submitting = false
      return
    }
    try {
      await onSave(token, outcome.user)
    } catch {
      failure = { kind: 'rejected', error: 'Could not save the token, try again' }
    } finally {
      submitting = false
    }
  }

  function cancel() {
    onCancel()
  }

  function closeOnEscape(event: KeyboardEvent) {
    if (event.key === 'Escape' && form?.contains(event.target as Node)) {
      cancel()
    }
  }

  function addAsNew(event: MouseEvent) {
    event.preventDefault()
    onAddAsNew(token)
  }
</script>

<svelte:window onkeydown={closeOnEscape} />

{#snippet hint()}
  <p class="sign-in-hint">
    {#if account.user}Must sign in as <b class="mono">@{account.user}</b> on {hostName}.{/if}
    Watched repos and settings are kept.
  </p>
  <TokenHelp />
{/snippet}

<form
  class="replace"
  id="replace-{account.id}"
  aria-label="Replace token for {account.label}"
  novalidate
  bind:this={form}
  onsubmit={save}
>
  {#if failure}
    <Banner variant="err">
      <b>Couldn’t replace token.</b>
      {#if failure.kind === 'other-account'}
        It signs in as <span class="mono">@{failure.user}</span>, not
        <span class="mono">@{account.user}</span>.
        <a href="#add-connection" onclick={addAsNew}>Add it as a new connection instead</a>
      {:else if failure.status}
        {providerName(account.provider)} returned HTTP {failure.status}, the token may be expired or
        missing a permission
      {:else}
        {failure.error}
      {/if}
    </Banner>
  {/if}
  <FormSummary errors={summaryErrors} />
  <Field name={fieldName} label="New personal access token" {hint} {error} mono {below}>
    <PasswordInput bind:value={token} oninput={clearErrorIfFilled} />
  </Field>
  <div class="button-group">
    <Button variant="primary" type="submit" {submitting}>
      <KeyRound size={14} />
      {submitting ? 'Saving token…' : 'Save token'}
    </Button>
    <Button variant="secondary" onclick={validate}>
      <BadgeCheck size={14} /> Validate
    </Button>
    <button class="text-button" type="button" onclick={cancel}>Cancel</button>
  </div>
</form>

<style>
  .replace {
    margin: 0;
    padding: var(--space-2xl) var(--space-3xl) var(--space-3xl);
    border-top: 1px solid var(--border);
    background: var(--surface-2);
  }
  .sign-in-hint {
    margin: 0;
  }
  .sign-in-hint b {
    color: var(--text-2);
    font-weight: var(--weight-semibold);
  }
  .mono {
    font-family: var(--font-mono);
  }
  .replace a {
    color: inherit;
    font-weight: var(--weight-semibold);
  }
  .button-group {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-md);
  }
  .text-button {
    margin-left: var(--space-2xs);
    padding: var(--space-2xs) 0;
    border: 0;
    background: transparent;
    color: var(--link);
    font: var(--weight-semibold) var(--font-size-base) / var(--leading-none) var(--font-sans);
    cursor: pointer;
    white-space: nowrap;
  }
  .text-button:hover {
    text-decoration: underline;
    text-underline-offset: 2px;
  }
</style>
