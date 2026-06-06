<script lang="ts">
  import Lock from '@lucide/svelte/icons/lock'
  import type { Snippet } from 'svelte'

  let { children }: { children?: Snippet } = $props()
</script>

<p class="permnote">
  <Lock size={15} />
  {#if children}{@render children()}{:else}
    Self-hosted hosts request permission when you validate. Tokens stay on this device.
  {/if}
</p>

<style>
  .permnote {
    display: flex;
    gap: 9px;
    align-items: flex-start;
    margin: 0;
    padding: 10px 12px;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    background: var(--surface-2);
    font-size: 11.5px;
    color: var(--text-2);
    line-height: 1.5;
  }
  .permnote :global(svg) {
    flex: none;
    margin-top: 1px;
    color: var(--pending);
  }
</style>
