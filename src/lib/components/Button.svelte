<script lang="ts">
  import type { Snippet } from 'svelte'

  let {
    variant = 'primary',
    type = 'button',
    submitting = false,
    disabled = false,
    onclick,
    children
  }: {
    variant?: 'primary' | 'secondary'
    type?: 'button' | 'submit'
    submitting?: boolean
    disabled?: boolean
    onclick?: () => void
    children: Snippet
  } = $props()
</script>

<button {type} class="btn {variant}" class:submitting disabled={disabled || submitting} {onclick}>
  {@render children()}
</button>

<style>
  .btn {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 10px 15px;
    border: 1px solid transparent;
    border-radius: var(--radius);
    font: 650 12.5px/1 var(--font-sans);
    cursor: pointer;
  }
  .primary {
    background: var(--brand);
    color: var(--brand-ink);
  }
  .primary:hover {
    background: color-mix(in oklab, var(--brand) 88%, black);
  }
  .secondary {
    background: var(--surface);
    color: var(--text);
    border-color: var(--border-2);
  }
  .secondary:hover {
    background: var(--hover);
  }
  .btn[disabled] {
    opacity: 0.6;
    cursor: default;
  }
  /* in-flight: hide the label (still read by AT) and spin */
  .btn.submitting {
    position: relative;
    color: transparent;
  }
  .btn.submitting::after {
    content: '';
    position: absolute;
    inset: 0;
    margin: auto;
    width: 14px;
    height: 14px;
    border: 2px solid color-mix(in srgb, var(--brand-ink) 70%, transparent);
    border-right-color: transparent;
    border-radius: 50%;
    animation: btn-spin 0.8s linear infinite;
  }
  @keyframes btn-spin {
    to {
      transform: rotate(360deg);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .btn.submitting::after {
      animation: none;
    }
  }
</style>
