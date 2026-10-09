<script lang="ts">
  import { tick } from 'svelte'
  import KeyRound from '@lucide/svelte/icons/key-round'
  import Trash2 from '@lucide/svelte/icons/trash-2'
  import { providerName } from '../providers'
  import type { Account } from '../providers/types'
  import type { AccountHealth } from '../lib/storage'
  import { isTokenFailure } from '../lib/health'
  import { tooltip } from '../lib/tooltip'
  import MessageIcon from '../lib/components/forms/MessageIcon.svelte'
  import ReplaceTokenForm from './ReplaceTokenForm.svelte'
  import { pausedRepos } from './replace-token'

  let {
    account,
    health,
    watchedCount,
    open,
    replaced,
    flash,
    onOpen,
    onClose,
    onReplace,
    onAddAsNew,
    onRemove,
    onFlashEnd
  }: {
    account: Account
    health: AccountHealth | undefined
    watchedCount: number
    open: boolean
    replaced: boolean
    flash: boolean
    onOpen: () => void
    onClose: () => void
    onReplace: (token: string, user: string | undefined) => Promise<void>
    onAddAsNew: (token: string) => void
    onRemove: () => void
    onFlashEnd: () => void
  } = $props()

  let trigger = $state<HTMLButtonElement>()
  const failing = $derived(isTokenFailure(health))

  async function focusTrigger() {
    await tick()
    trigger?.focus()
  }

  function cancel() {
    onClose()
    focusTrigger()
  }

  async function replace(token: string, user: string | undefined) {
    await onReplace(token, user)
    focusTrigger()
  }
</script>

<li
  class="connection"
  class:failing
  class:flash
  id="connection-{account.id}"
  onanimationend={(event) => event.target === event.currentTarget && onFlashEnd()}
>
  <div class="connection-row">
    <span class="dot" class:failing aria-hidden="true"></span>
    <span class="connection-main">
      <span class="connection-label">{account.label}</span>
      <span class="connection-host">{account.host}</span>
    </span>
    <span class="connection-actions">
      {#if failing}
        <span class="token-state failing"><MessageIcon variant="token-bad" /> token rejected</span>
      {:else}
        <span class="token-state">
          <MessageIcon variant="token-ok" />
          {replaced ? 'token replaced' : 'token saved'}
        </span>
      {/if}
      <span class="connection-buttons">
        {#if !open}
          <button
            bind:this={trigger}
            class="icon-button"
            aria-label="Replace token for {account.label}"
            aria-expanded="false"
            aria-controls="replace-{account.id}"
            use:tooltip={'Replace token'}
            onclick={onOpen}
          >
            <KeyRound size={15} />
          </button>
        {/if}
        <button
          class="icon-button"
          aria-label="Remove {account.label} connection"
          use:tooltip={'Remove'}
          onclick={onRemove}
        >
          <Trash2 size={15} />
        </button>
      </span>
    </span>
  </div>
  {#if failing && !open}
    <p class="connection-note">
      {providerName(account.provider)} returned <b>HTTP {health?.status}</b>.
      {watchedCount > 0
        ? `${pausedRepos(watchedCount)} until you replace the token.`
        : 'Replace the token to reconnect.'}
    </p>
  {/if}
  {#if open}
    <ReplaceTokenForm {account} onSave={replace} onCancel={cancel} {onAddAsNew} />
  {/if}
</li>

<style>
  .connection {
    --dot-size: 9px;
    border-bottom: 1px solid var(--border);
  }
  .connection.failing {
    box-shadow: inset 2px 0 0 var(--failed);
  }
  .connection.flash {
    animation: flash 1.4s ease-out;
  }
  @keyframes flash {
    from {
      background: var(--brand-soft);
    }
    to {
      background: transparent;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .connection.flash {
      animation: none;
    }
  }
  .connection-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-lg);
    padding: var(--space-xl) var(--space-3xl);
  }
  .dot {
    width: var(--dot-size);
    height: var(--dot-size);
    border-radius: 50%;
    flex: none;
    background: var(--success);
  }
  .dot.failing {
    background: var(--failed);
  }
  .connection-main {
    flex: 1 1 140px;
    min-width: 0;
  }
  .connection-label {
    display: block;
    font-weight: var(--weight-bold);
    font-size: var(--font-size-md);
  }
  .connection-host {
    font: var(--weight-medium) var(--font-size-sm) / var(--leading-snug) var(--font-mono);
    color: var(--text-3);
  }
  .connection-actions {
    display: flex;
    align-items: center;
    gap: var(--space-lg);
    margin-left: auto;
  }
  .token-state {
    display: inline-flex;
    align-items: center;
    gap: var(--space-xs);
    font-size: var(--font-size-sm);
    font-weight: var(--weight-semibold);
    white-space: nowrap;
    color: var(--success);
  }
  .token-state.failing {
    color: var(--alarm-ink);
  }
  .connection-buttons {
    display: flex;
    gap: var(--space-2xs);
  }
  .icon-button {
    display: grid;
    place-items: center;
    width: 30px;
    height: 30px;
    border: 0;
    border-radius: var(--radius);
    background: transparent;
    color: var(--text-2);
    cursor: pointer;
  }
  .icon-button:hover {
    background: var(--hover);
    color: var(--text);
  }
  .connection-note {
    margin: calc(var(--space-xs) * -1) 0 0;
    padding: 0 var(--space-3xl) var(--space-xl)
      calc(var(--space-3xl) + var(--dot-size) + var(--space-lg));
    font-size: var(--font-size-sm);
    line-height: var(--leading-normal);
    color: var(--text-2);
    text-wrap: pretty;
  }
  .connection-note b {
    color: var(--text);
    font-weight: var(--weight-semibold);
  }
</style>
