<script lang="ts">
  import Lock from '@lucide/svelte/icons/lock'
  import type { Snippet } from 'svelte'

  let { children }: { children?: Snippet } = $props()
</script>

<p class="permission-note">
  <Lock size={15} />
  {#if children}{@render children()}{:else}
    Self-hosted hosts request permission when you validate. Tokens stay on this device.
  {/if}
</p>

<style>
  .permission-note {
    display: flex;
    gap: var(--space-md);
    align-items: flex-start;
    margin: 0;
    padding: var(--space-md) var(--space-lg);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    background: var(--surface-2);
    font-size: var(--font-size-sm);
    color: var(--text-2);
    line-height: var(--leading-relaxed);
  }
  .permission-note :global(svg) {
    flex: none;
    margin-top: 1px;
    color: var(--pending);
  }
</style>
