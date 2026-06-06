<script lang="ts">
  import type { Snippet } from 'svelte'
  import MessageIcon from './forms/MessageIcon.svelte'

  let { variant, children }: { variant: 'ok' | 'err'; children: Snippet } = $props()
</script>

<div class="form-message {variant}" role={variant === 'err' ? 'alert' : 'status'}>
  <MessageIcon variant={variant === 'ok' ? 'success' : 'error'} size={15} />
  <span>{@render children()}</span>
</div>
