<script lang="ts">
  import { relativeTime, absoluteTime } from '../relative-time'
  import Tooltip from './Tooltip.svelte'

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

<Tooltip text={exact}>
  <time class="relative-time" datetime={iso}>{label}</time>
</Tooltip>

<style>
  .relative-time {
    font: var(--weight-medium) var(--font-size-xs) / var(--leading-none) var(--font-mono);
    color: var(--text-3);
    white-space: nowrap;
  }
</style>
