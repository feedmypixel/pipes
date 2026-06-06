<script lang="ts">
  import { toasts, dismiss } from '../toasts.svelte'
  import Toast from './Toast.svelte'
</script>

<div class="toast-stack" aria-live="polite">
  {#each toasts as item (item.id)}
    <Toast {item} onclose={() => dismiss(item.id)} />
  {/each}
</div>

<style>
  .toast-stack {
    position: fixed;
    right: 16px;
    bottom: 16px;
    z-index: var(--toast-z);
    display: flex;
    flex-direction: column-reverse;
    gap: var(--toast-gap);
    width: var(--toast-width);
  }
</style>
