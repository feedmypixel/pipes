<script lang="ts">
  import type { PipelineStatus } from '../../providers/types'
  import { statusVisual } from './status-icon'

  let { status, size = 20 }: { status: PipelineStatus; size?: number } = $props()

  const visual = $derived(statusVisual(status))
  const symbolSize = $derived(Math.round(size * 0.56))
</script>

<span
  class="status"
  class:spin={visual.symbol === 'arc'}
  style="--circle: {visual.colour}; --size: {size}px; --symbol: {symbolSize}px"
  role="img"
  aria-label={visual.label}
  title={visual.label}
>
  <svg viewBox="0 0 24 24" aria-hidden="true">
    {#if visual.symbol === 'check'}
      <path d="M5 13l4 4L19 7" />
    {:else if visual.symbol === 'cross'}
      <path d="M7 7l10 10M17 7L7 17" />
    {:else if visual.symbol === 'pause'}
      <path d="M9.5 7v10M14.5 7v10" />
    {:else if visual.symbol === 'slash'}
      <path d="M6 18L18 6" />
    {:else if visual.symbol === 'chevrons'}
      <path d="M7 7l5 5-5 5M13 7l5 5-5 5" />
    {:else if visual.symbol === 'arc'}
      <path d="M12 4a8 8 0 1 1-8 8" />
    {:else}
      <circle cx="12" cy="12" r="3" fill="currentColor" stroke="none" />
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
    color: white;
    fill: none;
    stroke: currentcolor;
    stroke-width: 2.6;
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
