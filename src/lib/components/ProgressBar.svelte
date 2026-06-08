<script lang="ts">
  // Just the fill, no track: a border-coloured 3px bar that sits on the row's bottom border and
  // grows left→right with the pipeline's job completion. Only shown while running; non-running
  // rows keep their plain border. The parent row must be position: relative.
  let { progress = 0 }: { progress?: number } = $props()

  const width = $derived(`${Math.round(Math.min(1, Math.max(0, progress)) * 100)}%`)
</script>

<span class="fill" style="--w: {width}" aria-hidden="true"></span>

<style>
  .fill {
    position: absolute;
    left: 0;
    bottom: 0;
    height: 2px;
    width: var(--w);
    background: var(--border);
    transition: width 0.4s ease;
  }
</style>
