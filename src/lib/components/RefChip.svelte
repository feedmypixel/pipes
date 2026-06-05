<script lang="ts">
  import GitBranch from '@lucide/svelte/icons/git-branch'

  let { ref }: { ref: string } = $props()
</script>

<span class="ref">
  <GitBranch size={11} aria-hidden="true" />
  <span class="name">{ref}</span>
</span>

<style>
  .ref {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    min-width: 0;
    max-width: 160px;
    font: 500 11px/1 var(--font-mono);
    color: var(--text-2);
  }
  .ref :global(svg) {
    flex: none;
    opacity: 0.6;
  }
  .name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
