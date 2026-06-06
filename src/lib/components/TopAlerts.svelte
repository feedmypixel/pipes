<script lang="ts">
  import TriangleAlert from '@lucide/svelte/icons/triangle-alert'
  import Check from '@lucide/svelte/icons/check'

  let {
    connectionIssues,
    mainFailing,
    ready,
    onOpenSettings
  }: {
    connectionIssues: { id: string; label: string; error?: string }[]
    mainFailing: number
    ready: boolean
    onOpenSettings: () => void
  } = $props()
</script>

{#each connectionIssues as issue (issue.id)}
  <button class="issue" onclick={onOpenSettings} title="Open settings to reconnect">
    <TriangleAlert size={15} />
    <span>{issue.label} connection problem{issue.error ? `: ${issue.error}` : ''}</span>
  </button>
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
  .alarm,
  .all-clear {
    display: flex;
    align-items: center;
    gap: var(--space-md);
    padding: var(--space-md) var(--space-xl);
    font-size: var(--font-size-base);
  }
  .issue :global(svg),
  .all-clear :global(svg) {
    flex: none;
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
