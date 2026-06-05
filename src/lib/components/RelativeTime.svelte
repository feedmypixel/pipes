<script lang="ts">
  import { relativeTime } from '../relative-time'

  let { iso }: { iso: string } = $props()

  let now = $state(Date.now())

  $effect(() => {
    const id = setInterval(() => {
      now = Date.now()
    }, 30_000)
    return () => clearInterval(id)
  })

  const label = $derived(relativeTime(iso, now))
</script>

<time class="rel" datetime={iso}>{label}</time>

<style>
  .rel {
    font: 500 11px/1 var(--font-mono);
    color: var(--text-3);
    white-space: nowrap;
  }
</style>
