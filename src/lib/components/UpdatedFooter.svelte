<script lang="ts">
  import RelativeTime from './RelativeTime.svelte'

  let { lastPolledAt, configured }: { lastPolledAt: number; configured: boolean } = $props()
</script>

<footer class="footer">
  <span class="live">
    <span class="pulse" class:idle={!configured}></span>
    {#if !configured}
      Waiting for connection
    {:else if lastPolledAt > 0}
      updated <RelativeTime iso={new Date(lastPolledAt).toISOString()} />
    {:else}
      updating…
    {/if}
  </span>
</footer>

<style>
  .footer {
    display: flex;
    align-items: center;
    padding: var(--space-sm) var(--space-xl);
    border-top: 1px solid var(--border);
    background: var(--surface);
    font: var(--weight-medium) var(--font-size-xs) / var(--leading-none) var(--font-mono);
    color: var(--text-3);
  }
  .live {
    display: inline-flex;
    align-items: center;
    gap: var(--space-xs);
  }
  .pulse {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--success);
    animation: live-pulse 1.6s ease-in-out infinite;
  }
  .pulse.idle {
    background: var(--text-3);
    animation: none;
  }
  @keyframes live-pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.35;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .pulse {
      animation: none;
    }
  }
</style>
