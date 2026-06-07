<script lang="ts">
  import type { PipelineStatus } from '../../providers/types'
  import { statusVisual } from './status-icon'
  import { tooltip } from '../tooltip'

  let { status, size = 20 }: { status: PipelineStatus; size?: number } = $props()

  const visual = $derived(statusVisual(status))
  const symbolSize = $derived(Math.round(size * 0.66))
</script>

<span
  class="status"
  class:spin={visual.symbol === 'arc'}
  style="--circle: {visual.colour}; --size: {size}px; --symbol: {symbolSize}px"
  role="img"
  aria-label={visual.label}
  use:tooltip={visual.label}
>
  <svg viewBox="0 0 24 24" aria-hidden="true">
    {#if visual.symbol === 'check'}
      <path d="M4.5 12.5l4.5 4.5L20 6" />
    {:else if visual.symbol === 'cross'}
      <path d="M6 6l12 12M18 6L6 18" />
    {:else if visual.symbol === 'pause'}
      <path d="M9 6v12M15 6v12" />
    {:else if visual.symbol === 'slash'}
      <path d="M5.5 18.5L18.5 5.5" />
    {:else if visual.symbol === 'chevrons'}
      <path d="M6.5 5.5l6.5 6.5-6.5 6.5M12.5 5.5l6.5 6.5-6.5 6.5" />
    {:else if visual.symbol === 'arc'}
      <path d="M12 3a9 9 0 1 1-9 9" />
    {:else}
      <path d="M7.5 8a4.5 4.5 0 0 1 8.5 2.1c0 3.2-4.5 3.9-4.5 6" />
      <path d="M12 19.5h.01" />
    {/if}
  </svg>
</span>

<style>
  .status {
    display: grid;
    place-items: center;
    flex: none;
    width: var(--size);
    height: var(--size);
    background: var(--circle);
    border-radius: 50%;
  }
  svg {
    width: var(--symbol);
    height: var(--symbol);
    color: var(--status-ink);
    fill: none;
    stroke: currentcolor;
    stroke-width: 3;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .spin svg {
    animation: spin 1.1s linear infinite;
  }
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .spin svg {
      animation: none;
    }
  }
</style>
