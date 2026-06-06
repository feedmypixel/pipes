<script lang="ts">
  import type { HTMLInputAttributes } from 'svelte/elements'
  import { getFieldContext } from './field-context'

  let {
    value = $bindable(''),
    type = 'text',
    ...rest
  }: { value?: string; type?: 'text' | 'url' | 'password' } & HTMLInputAttributes = $props()

  const field = getFieldContext()
  const ctx = $derived(field())
</script>

<input
  {...rest}
  {type}
  id={ctx.id}
  class:mono={ctx.mono}
  aria-describedby={ctx.describedBy}
  aria-invalid={ctx.invalid ? 'true' : undefined}
  bind:value
/>

<style>
  input {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid var(--border-2);
    border-radius: var(--radius);
    background: var(--bg);
    color: var(--text);
    font: 500 13px/1.2 var(--font-sans);
    transition:
      border-color 0.12s,
      box-shadow 0.12s;
  }
  input::placeholder {
    color: var(--text-3);
  }
  input:focus-visible {
    outline: 0;
    border-color: var(--brand);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--brand) 28%, transparent);
  }
  input[aria-invalid='true'] {
    border-color: var(--failed);
  }
  input[aria-invalid='true']:focus-visible {
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--failed) 28%, transparent);
  }
  input.mono {
    font-family: var(--font-mono);
    font-size: 12px;
  }
</style>
