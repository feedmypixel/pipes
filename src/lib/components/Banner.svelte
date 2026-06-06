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
    align-items: flex-start;
    gap: 9px;
    margin-bottom: 16px;
    padding: 11px 14px;
    border: 1px solid;
    border-radius: var(--radius);
    font-size: 12.5px;
    line-height: 1.45;
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
