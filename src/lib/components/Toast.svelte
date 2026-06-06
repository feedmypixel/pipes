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

<style>
  .toast {
    display: flex;
    align-items: flex-start;
    gap: var(--space-lg);
    width: var(--toast-width);
    padding: var(--space-lg);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    background: var(--surface);
    box-shadow: var(--shadow-lg);
    animation: toast-in 0.22s cubic-bezier(0.2, 0.7, 0.3, 1) both;
  }
  @keyframes toast-in {
    from {
      opacity: 0;
      transform: translateY(8px) scale(0.98);
    }
  }
  /* tinted fill derived from the status colour (themed in tokens.css) */
  .toast.success {
    background: var(--toast-success-fill);
    border-color: var(--toast-success-edge);
  }
  .toast.error {
    background: var(--toast-error-fill);
    border-color: var(--toast-error-edge);
  }
  .toast.info {
    background: var(--toast-info-fill);
    border-color: var(--toast-info-edge);
  }
  .toast-main {
    min-width: 0;
    flex: 1;
  }
  .toast-title {
    font-size: var(--font-size-base);
    font-weight: var(--weight-bold);
    color: var(--text);
    line-height: var(--leading-snug);
  }
  .toast-msg {
    margin-top: var(--space-3xs);
    font-size: var(--font-size-sm);
    color: var(--text-2);
    line-height: var(--leading-normal);
  }
  .toast-action {
    display: inline-block;
    margin-top: var(--space-sm);
    padding: 0;
    border: 0;
    background: transparent;
    color: var(--link);
    font: var(--weight-bold) var(--font-size-sm) / var(--leading-none) var(--font-sans);
    cursor: pointer;
  }
  .toast-action:hover {
    text-decoration: underline;
  }
  .toast-close {
    flex: none;
    display: grid;
    place-items: center;
    width: 22px;
    height: 22px;
    padding: 0;
    border: 0;
    border-radius: var(--radius-pill);
    background: transparent;
    color: var(--text-3);
    line-height: 0;
    cursor: pointer;
  }
  .toast-close:hover {
    background: var(--hover);
    color: var(--text);
  }
  .toast.undo {
    align-items: center;
  }
  .toast.undo .toast-main {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
  }
  .toast.undo .toast-title {
    font-weight: 600;
  }
  .toast.undo .toast-action {
    margin-top: 0;
  }
  @media (prefers-reduced-motion: reduce) {
    .toast {
      animation: none;
    }
  }
</style>
