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
    bottom: calc(100% + 8px);
    left: 50%;
    transform: translateX(-50%);
    z-index: 10;
    padding: var(--space-xs) var(--space-md);
    background: var(--surface-2);
    color: var(--text);
    border: 1px solid var(--border-2);
    border-radius: var(--radius);
    white-space: nowrap;
    font: var(--weight-medium) var(--font-size-2xs) / var(--leading-none) var(--font-sans);
    box-shadow: var(--shadow);
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.12s;
  }
  /* Stem pointing down to the trigger: border-coloured triangle behind, surface fill in front. */
  .bubble::before,
  .bubble::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border: 6px solid transparent;
  }
  .bubble::before {
    border-top-color: var(--border-2);
  }
  .bubble::after {
    margin-top: -1.5px;
    border-top-color: var(--surface-2);
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
