<script lang="ts">
  import type { HTMLInputAttributes } from 'svelte/elements'
  import { getFieldContext } from './field-context'

  let {
    value = $bindable(''),
    type = 'text',
    ...rest
  }: { value?: string; type?: 'text' | 'url' } & HTMLInputAttributes = $props()

  const field = getFieldContext()
  const ctx = $derived(field())
</script>

<input
  {...rest}
  {type}
  id={ctx.id}
  aria-describedby={ctx.describedBy}
  aria-invalid={ctx.invalid ? 'true' : undefined}
  bind:value
/>
