<script lang="ts">
  import type { PipelineStatus } from '../../providers/types'
  import { statusVisual } from './status-icon'
  import { tooltip } from '../tooltip'

  let { counts }: { counts: { status: PipelineStatus; count: number }[] } = $props()
</script>

{#if counts.length > 0}
  <span class="counts">
    {#each counts as { status, count } (status)}
      {@const visual = statusVisual(status)}
      <span
        class="count"
        style="--circle: {visual.colour}; --ink: {visual.ink ?? 'var(--status-ink)'}"
        use:tooltip={`${count} ${visual.label}`}
      >
        {count}
      </span>
    {/each}
  </span>
{/if}

<style>
  .counts {
    flex: none;
    display: inline-flex;
    align-items: center;
    gap: var(--space-2xs);
  }
  .count {
    display: inline-grid;
    place-items: center;
    min-width: 20px;
    height: 20px;
    padding: 0 var(--space-2xs);
    border-radius: var(--radius-pill);
    background: var(--circle);
    color: var(--ink);
    font: var(--weight-bold) var(--font-size-2xs) / 1 var(--font-mono);
  }
</style>
