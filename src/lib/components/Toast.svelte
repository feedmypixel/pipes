<script lang="ts">
  import X from '@lucide/svelte/icons/x'
  import MessageIcon from './forms/MessageIcon.svelte'
  import type { ToastItem } from '../toasts.svelte'

  let { item, onclose }: { item: ToastItem; onclose: () => void } = $props()

  const iconVariant = $derived(
    item.variant === 'error' ? 'error' : item.variant === 'success' ? 'success' : 'info'
  )
</script>

<div class="toast {item.variant}" class:undo={item.undo} role="status">
  <MessageIcon variant={iconVariant} size={22} />
  <div class="toast-main">
    <div class="toast-title">{item.title}</div>
    {#if item.message}<div class="toast-msg">{item.message}</div>{/if}
    {#if item.action}
      {@const action = item.action}
      <button
        class="toast-action"
        onclick={() => {
          action.run()
          onclose()
        }}>{action.label}</button
      >
    {/if}
  </div>
  <button class="toast-close" aria-label="Dismiss" onclick={onclose}><X size={14} /></button>
</div>
