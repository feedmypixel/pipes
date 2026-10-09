<script lang="ts">
  // Solid message icons in the StatusIcon style; warning is the one non-circle.
  type Variant = 'success' | 'error' | 'warning' | 'info' | 'token-ok' | 'token-bad' | 'lock'

  let { variant, size = 16 }: { variant: Variant; size?: number } = $props()

  const colours = {
    success: { circle: 'var(--success)', ink: 'var(--status-ink)' },
    error: { circle: 'var(--failed)', ink: 'var(--status-ink)' },
    warning: { circle: 'transparent', ink: 'var(--status-ink)' },
    info: { circle: 'var(--brand)', ink: 'var(--brand-ink)' },
    'token-ok': { circle: 'var(--success)', ink: 'var(--status-ink)' },
    'token-bad': { circle: 'var(--failed)', ink: 'var(--status-ink)' },
    lock: { circle: 'var(--neutral)', ink: 'var(--status-ink)' }
  }

  const { circle, ink } = $derived(colours[variant])
  const symbol = $derived(variant === 'warning' ? size : Math.round(size * 0.66))
</script>

<span
  class="message-icon"
  aria-hidden="true"
  style="--size: {size}px; --symbol: {symbol}px; --circle: {circle}; --ink: {ink}"
>
  <svg viewBox="0 0 24 24">
    {#if variant === 'success'}
      <path d="M4.5 12.5l4.5 4.5L20 6" />
    {:else if variant === 'error'}
      <path d="M6 6l12 12M18 6L6 18" />
    {:else if variant === 'info'}
      <path d="M12 11v7" />
      <path d="M12 6.5h.01" />
    {:else if variant === 'token-ok' || variant === 'token-bad'}
      <circle cx="7.5" cy="12" r="3.5" />
      <path d="M11 12h9.5M17.5 12v3.5" />
    {:else if variant === 'lock'}
      <rect x="5" y="11" width="14" height="9.5" rx="2" fill="currentColor" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    {:else}
      <path
        d="M12 3.6 21.6 20.2H2.4Z"
        fill="var(--pending)"
        stroke="var(--pending)"
        stroke-width="3"
        stroke-linejoin="round"
      />
      <path d="M12 9.6v4.6" stroke="var(--status-ink)" stroke-width="2.6" stroke-linecap="round" />
      <path d="M12 17.4h.01" stroke="var(--status-ink)" stroke-width="2.9" stroke-linecap="round" />
    {/if}
  </svg>
</span>

<style>
  .message-icon {
    display: inline-grid;
    place-items: center;
    flex: none;
    width: var(--size);
    height: var(--size);
    border-radius: 50%;
    background: var(--circle);
    color: var(--ink);
  }
  svg {
    width: var(--symbol);
    height: var(--symbol);
    display: block;
    fill: none;
    stroke: var(--ink);
    stroke-width: 3;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
</style>
