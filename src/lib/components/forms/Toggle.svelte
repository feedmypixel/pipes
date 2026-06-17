<script lang="ts">
  // Controlled switch: renders `checked`, emits the next state on click. The parent owns the value.
  let {
    checked,
    label,
    onchange
  }: {
    checked: boolean
    label: string
    onchange: (checked: boolean) => void
  } = $props()
</script>

<button
  class="toggle"
  role="switch"
  aria-checked={checked}
  aria-label={label}
  onclick={() => onchange(!checked)}
></button>

<style>
  .toggle {
    position: relative;
    width: 42px;
    height: 24px;
    flex: none;
    border: 0;
    border-radius: var(--radius-pill);
    background: var(--border-2);
    cursor: pointer;
    transition: background 0.15s;
  }
  .toggle::after {
    content: '';
    position: absolute;
    top: 3px;
    left: 3px;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: var(--status-ink);
    transition: transform 0.15s;
  }
  .toggle[aria-checked='true'] {
    background: var(--brand);
  }
  .toggle[aria-checked='true']::after {
    transform: translateX(18px);
  }
  @media (prefers-reduced-motion: reduce) {
    .toggle,
    .toggle::after {
      transition: none;
    }
  }
</style>
