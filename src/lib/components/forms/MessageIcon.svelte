<script lang="ts">
  // Solid message icons (white symbol on a filled shape) for banners + toasts.
  let { variant, size = 15 }: { variant: 'success' | 'error' | 'warning' | 'info'; size?: number } =
    $props()
</script>

<span class="message-icon" style="--size: {size}px">
  <svg viewBox="0 0 24 24" aria-hidden="true">
    {#if variant === 'success'}
      <circle cx="12" cy="12" r="11" fill="var(--success)" />
      <path
        d="M7 12.5l3.2 3.2L17 8.5"
        fill="none"
        stroke="var(--status-ink)"
        stroke-width="2.4"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    {:else if variant === 'info'}
      <circle cx="12" cy="12" r="11" fill="var(--brand)" />
      <circle cx="12" cy="7.7" r="1.4" fill="var(--status-ink)" />
      <rect x="10.7" y="10.7" width="2.6" height="6.4" rx="1.3" fill="var(--status-ink)" />
    {:else}
      <path
        d="M12 4L20.5 19H3.5Z"
        fill={variant === 'warning' ? 'var(--pending)' : 'var(--failed)'}
        stroke={variant === 'warning' ? 'var(--pending)' : 'var(--failed)'}
        stroke-width="2.2"
        stroke-linejoin="round"
      />
      <rect x="10.85" y="9" width="2.3" height="5.4" rx="1.15" fill="var(--status-ink)" />
      <circle cx="12" cy="16.7" r="1.2" fill="var(--status-ink)" />
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
  }
  svg {
    width: 100%;
    height: 100%;
    display: block;
  }
</style>
