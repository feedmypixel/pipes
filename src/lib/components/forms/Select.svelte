<script lang="ts">
  import type { HTMLSelectAttributes } from 'svelte/elements'
  import type { Snippet } from 'svelte'
  import { getFieldContext } from './field-context'

  let {
    value = $bindable(''),
    children,
    ...rest
  }: { value?: string; children: Snippet } & HTMLSelectAttributes = $props()

  const field = getFieldContext()
  const ctx = $derived(field())
</script>

<select
  {...rest}
  id={ctx.id}
  aria-describedby={ctx.describedBy}
  aria-invalid={ctx.invalid ? 'true' : undefined}
  bind:value
>
  {@render children()}
</select>

<style>
  select {
    width: 100%;
    padding: var(--space-md) var(--space-lg);
    border: 1px solid var(--border-2);
    border-radius: var(--radius);
    background: var(--bg);
    color: var(--text);
    font: var(--weight-medium) var(--font-size-base) / var(--leading-tight) var(--font-sans);
    cursor: pointer;
    transition:
      border-color 0.12s,
      box-shadow 0.12s;
  }
  select:focus-visible {
    outline: 0;
    border-color: var(--brand);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--brand) 28%, transparent);
  }
  select[aria-invalid='true'] {
    border-color: var(--failed);
  }
</style>
