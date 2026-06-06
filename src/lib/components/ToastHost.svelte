<script lang="ts">
  import { toasts, dismiss } from '../toasts.svelte'
  import Toast from './Toast.svelte'
</script>

<div class="toast-stack" aria-live="polite">
  {#each toasts as item (item.id)}
    <Toast {item} onclose={() => dismiss(item.id)} />
  {/each}
</div>
