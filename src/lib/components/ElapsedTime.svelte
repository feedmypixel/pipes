<script lang="ts">
  import { elapsedTime } from '../relative-time'

  // Live "running 14m" for an in-progress pipeline — ticks locally off a fixed start time, so it's
  // smooth + accurate with no dependence on the polling cadence or the provider's cache.
  let { startedAt }: { startedAt: string } = $props()

  let now = $state(Date.now())

  $effect(() => {
    const id = setInterval(() => {
      now = Date.now()
    }, 1000)
    return () => clearInterval(id)
  })

  const label = $derived(elapsedTime(startedAt, now))
</script>

<time class="elapsed" datetime={startedAt}>running {label}</time>

<style>
  .elapsed {
    font: var(--weight-medium) var(--font-size-xs) / var(--leading-tight) var(--font-mono);
    color: var(--text-2);
    white-space: nowrap;
  }
</style>
