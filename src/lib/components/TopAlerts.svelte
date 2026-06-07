<script lang="ts">
  import TriangleAlert from '@lucide/svelte/icons/triangle-alert'
  import Clock from '@lucide/svelte/icons/clock'
  import Check from '@lucide/svelte/icons/check'

  let {
    connectionIssues,
    rateLimited = [],
    mainFailing,
    ready,
    onOpenSettings
  }: {
    connectionIssues: { id: string; label: string; error?: string }[]
    /** Accounts the provider rate-limited; `resumesAt` is epoch seconds. */
    rateLimited?: { id: string; label: string; resumesAt: number }[]
    mainFailing: number
    ready: boolean
    onOpenSettings: () => void
  } = $props()

  function resumesIn(resumesAt: number): string {
    const minutes = Math.max(1, Math.ceil((resumesAt * 1000 - Date.now()) / 60_000))
    return `~${minutes}m`
  }
</script>

{#each connectionIssues as issue (issue.id)}
  <button class="issue" onclick={onOpenSettings} title="Open settings to reconnect">
    <TriangleAlert size={15} />
    <span>{issue.label} connection problem{issue.error ? `: ${issue.error}` : ''}</span>
  </button>
{/each}

{#each rateLimited as account (account.id)}
  <div class="rate-limited">
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
  <div class="all-clear">
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
    width: 100%;
    border: 0;
    border-bottom: 1px solid var(--pending-line);
    background: var(--pending-bg);
    color: var(--pending);
    font-weight: var(--weight-semibold);
    text-align: left;
    cursor: pointer;
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
