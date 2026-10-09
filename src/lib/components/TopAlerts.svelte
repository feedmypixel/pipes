<script lang="ts">
  import Clock from '@lucide/svelte/icons/clock'
  import Check from '@lucide/svelte/icons/check'
  import MessageIcon from './forms/MessageIcon.svelte'

  let {
    connectionIssues,
    rateLimited = [],
    mainFailing,
    ready,
    onOpenSettings,
    onReplaceToken
  }: {
    connectionIssues: { id: string; label: string; error?: string; tokenFailure: boolean }[]
    /** Accounts the provider rate-limited; `resumesAt` is epoch seconds. */
    rateLimited?: { id: string; label: string; resumesAt: number }[]
    mainFailing: number
    ready: boolean
    onOpenSettings: () => void
    onReplaceToken: (accountId: string) => void
  } = $props()

  function resumesIn(resumesAt: number): string {
    const minutes = Math.max(1, Math.ceil((resumesAt * 1000 - Date.now()) / 60_000))
    return `~${minutes}m`
  }
</script>

{#each connectionIssues as issue (issue.id)}
  {@const message = `${issue.label} connection problem${issue.error ? `: ${issue.error}` : ''}`}
  {#if issue.tokenFailure}
    <div class="issue" role="status">
      <span class="issue-message"><MessageIcon variant="warning" /><span>{message}</span></span>
      <button
        class="issue-link"
        aria-label="Replace token for {issue.label}"
        onclick={() => onReplaceToken(issue.id)}>Replace token</button
      >
    </div>
  {:else}
    <button class="issue" onclick={onOpenSettings} title="Open settings to reconnect">
      <span class="issue-message"><MessageIcon variant="warning" /><span>{message}</span></span>
    </button>
  {/if}
{/each}

{#each rateLimited as account (account.id)}
  <div class="rate-limited" role="status">
    <Clock size={15} />
    <span>{account.label} rate limited — resumes in {resumesIn(account.resumesAt)}</span>
  </div>
{/each}

{#if mainFailing > 0}
  <div class="alarm" role="alert">
    <span class="blip"></span>
    <strong>
      {mainFailing} default {mainFailing === 1 ? 'branch' : 'branches'} failing
    </strong>
  </div>
{:else if ready}
  <div class="all-clear" role="status">
    <Check size={15} />
    <span>All default branches passing</span>
  </div>
{/if}

<style>
  .issue,
  .rate-limited,
  .alarm,
  .all-clear {
    display: flex;
    align-items: center;
    gap: var(--space-md);
    padding: var(--space-md) var(--space-xl);
    font-size: var(--font-size-base);
  }
  .issue :global(svg),
  .rate-limited :global(svg),
  .all-clear :global(svg) {
    flex: none;
  }
  .rate-limited {
    border-bottom: 1px solid var(--neutral-line);
    background: var(--neutral-bg);
    color: var(--neutral);
    font-weight: var(--weight-semibold);
  }
  .issue {
    flex-wrap: wrap;
    row-gap: var(--space-2xs);
    width: 100%;
    border: 0;
    border-bottom: 1px solid var(--pending-line);
    background: var(--pending-bg);
    color: var(--text);
    font-weight: var(--weight-semibold);
    text-align: left;
  }
  button.issue {
    cursor: pointer;
  }
  .issue-message {
    flex: 1 1 auto;
    min-width: 0;
    display: flex;
    align-items: center;
    gap: var(--space-md);
  }
  .issue-link {
    flex: none;
    margin-left: auto;
    padding: var(--space-2xs) 0;
    border: 0;
    background: transparent;
    color: var(--text);
    font: var(--weight-bold) var(--font-size-base) / var(--leading-none) var(--font-sans);
    text-decoration: underline;
    text-underline-offset: 2px;
    cursor: pointer;
  }
  .issue-link:hover {
    text-decoration-thickness: 2px;
  }
  .alarm {
    background: var(--alarm-strip);
    color: var(--alarm-ink);
    border-bottom: 1px solid var(--alarm-line);
    font-weight: var(--weight-semibold);
  }
  .blip {
    width: 9px;
    height: 9px;
    border-radius: 50%;
    background: var(--failed);
    animation: alarm-pulse 2s infinite;
  }
  @keyframes alarm-pulse {
    0% {
      box-shadow: 0 0 0 0 color-mix(in srgb, var(--failed) 50%, transparent);
    }
    70% {
      box-shadow: 0 0 0 7px transparent;
    }
    100% {
      box-shadow: 0 0 0 0 transparent;
    }
  }
  .all-clear {
    background: var(--success-bg);
    color: var(--success);
    border-bottom: 1px solid var(--success-line);
    font-weight: var(--weight-semibold);
  }
  @media (prefers-reduced-motion: reduce) {
    .blip {
      animation: none;
    }
  }
</style>
