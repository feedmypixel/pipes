<script lang="ts">
  // Controlled −/+ stepper. Emits the next value (decrement clamped to `min`, no upper bound); the
  // parent owns the value and persists it.
  let {
    value,
    min,
    step,
    unit,
    decLabel,
    incLabel,
    onchange
  }: {
    value: number
    min: number
    step: number
    unit?: string
    decLabel: string
    incLabel: string
    onchange: (next: number) => void
  } = $props()
</script>

<span class="stepper">
  <button onclick={() => onchange(Math.max(min, value - step))} aria-label={decLabel}>−</button>
  <span class="val"
    >{value}{#if unit}<small>{unit}</small>{/if}</span
  >
  <button onclick={() => onchange(value + step)} aria-label={incLabel}>+</button>
</span>

<style>
  .stepper {
    display: inline-flex;
    border: 1px solid var(--border-2);
    border-radius: var(--radius);
    overflow: hidden;
  }
  .stepper button {
    width: 32px;
    height: 34px;
    border: 0;
    background: var(--bg);
    color: var(--text-2);
    font-size: var(--font-size-xl);
    cursor: pointer;
  }
  .stepper button:hover {
    background: var(--hover);
  }
  .val {
    min-width: 64px;
    text-align: center;
    font: var(--weight-semibold) var(--font-size-base) / 34px var(--font-mono);
    border-left: 1px solid var(--border);
    border-right: 1px solid var(--border);
  }
  .val small {
    font-size: var(--font-size-2xs);
    color: var(--text-3);
  }
</style>
