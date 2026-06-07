<script lang="ts">
  import type { HTMLSelectAttributes } from 'svelte/elements'
  import type { Snippet } from 'svelte'
  import ChevronDown from '@lucide/svelte/icons/chevron-down'
  import { getFieldContext } from './field-context'

  let {
    value = $bindable(''),
    children,
    ...rest
  }: { value?: string; children: Snippet } & HTMLSelectAttributes = $props()

  const field = getFieldContext()
  const ctx = $derived(field())
</script>

<span class="select">
  <select
    {...rest}
    id={ctx.id}
    aria-describedby={ctx.describedBy}
    aria-invalid={ctx.invalid ? 'true' : undefined}
    bind:value
  >
    {@render children()}
  </select>
  <ChevronDown class="chevron" size={16} aria-hidden="true" />
</span>

<style>
  .select {
    position: relative;
    display: block;
  }
  select {
    width: 100%;
    /* Right padding clears the custom chevron; appearance:none drops the native arrow,
       which the browser pins to the edge and ignores padding on. */
    padding: var(--space-md) var(--space-lg);
    padding-right: var(--space-3xl);
    appearance: none;
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
  .select :global(.chevron) {
    position: absolute;
    top: 50%;
    right: var(--space-lg);
    transform: translateY(-50%);
    color: var(--text-2);
    pointer-events: none;
  }
</style>
