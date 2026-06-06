<script lang="ts">
  import type { HTMLInputAttributes } from 'svelte/elements'
  import { getFieldContext } from './field-context'

  let { value = $bindable(''), ...rest }: { value?: string } & HTMLInputAttributes = $props()

  const field = getFieldContext()
  const ctx = $derived(field())
  let show = $state(false)
</script>

<div class="pw-wrap">
  <input
    {...rest}
    id={ctx.id}
    type={show ? 'text' : 'password'}
    autocomplete="new-password"
    aria-describedby={ctx.describedBy}
    aria-invalid={ctx.invalid ? 'true' : undefined}
    bind:value
  />
  <button class="pw-toggle" type="button" onclick={() => (show = !show)}>
    {show ? 'Hide' : 'Show'}
  </button>
</div>
