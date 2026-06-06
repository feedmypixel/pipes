<script lang="ts">
  import type { Snippet } from 'svelte'
  import MessageIcon from './forms/MessageIcon.svelte'

  let { variant, children }: { variant: 'ok' | 'err'; children: Snippet } = $props()
</script>

<div class="form-message {variant}" role={variant === 'err' ? 'alert' : 'status'}>
  <MessageIcon variant={variant === 'ok' ? 'success' : 'error'} size={15} />
  <span>{@render children()}</span>
</div>

<style>
  .form-message {
    display: flex;
    align-items: center;
    gap: var(--space-md);
    margin-bottom: var(--space-2xl);
    padding: var(--space-lg) var(--space-xl);
    border: 1px solid;
    border-radius: var(--radius);
    font-size: var(--font-size-base);
    line-height: var(--leading-normal);
  }
  .form-message.ok {
    background: var(--success-bg);
    border-color: var(--success-line);
    color: var(--success);
  }
  .form-message.err {
    background: var(--failed-bg);
    border-color: var(--failed-line);
    color: var(--failed);
  }
</style>
