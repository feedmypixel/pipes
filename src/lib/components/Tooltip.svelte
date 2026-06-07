<script lang="ts">
  import type { Snippet } from 'svelte'

  // Simple hover/focus tooltip — replaces native `title=` (slow, unstyled). Wraps a trigger and
  // shows `text` above it. Token-styled, respects reduced motion.
  let { text, children }: { text: string; children: Snippet } = $props()
</script>

<span class="tooltip">
  {@render children()}
  <span class="bubble" role="tooltip">{text}</span>
</span>

<style>
  .tooltip {
    position: relative;
    display: inline-flex;
    min-width: 0;
  }
  .bubble {
    position: absolute;
    bottom: calc(100% + 6px);
    left: 50%;
    transform: translateX(-50%);
    z-index: 10;
    padding: var(--space-2xs) var(--space-sm);
    background: var(--text);
    color: var(--bg);
    border-radius: var(--radius);
    white-space: nowrap;
    font: var(--weight-medium) var(--font-size-2xs) / var(--leading-none) var(--font-sans);
    box-shadow: 0 2px 8px color-mix(in srgb, var(--text) 25%, transparent);
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.12s;
  }
  .tooltip:hover .bubble,
  .tooltip:focus-within .bubble {
    opacity: 1;
  }
  @media (prefers-reduced-motion: reduce) {
    .bubble {
      transition: none;
    }
  }
</style>
