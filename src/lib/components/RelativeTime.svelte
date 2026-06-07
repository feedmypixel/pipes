<script lang="ts">
  import { relativeTime, absoluteTime } from '../relative-time'
  import { tooltip } from '../tooltip'

  let { iso }: { iso: string } = $props()

  let now = $state(Date.now())

  $effect(() => {
    const id = setInterval(() => {
      now = Date.now()
    }, 30_000)
    return () => clearInterval(id)
  })

  const label = $derived(relativeTime(iso, now))
  const exact = $derived(absoluteTime(iso))
</script>

<time class="relative-time" datetime={iso} use:tooltip={exact}>{label}</time>

<style>
  .relative-time {
    font: var(--weight-medium) var(--font-size-xs) / var(--leading-none) var(--font-mono);
    color: var(--text-3);
    white-space: nowrap;
  }
</style>
