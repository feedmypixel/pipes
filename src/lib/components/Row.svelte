<script lang="ts">
  import type { Pipeline } from '../../providers/types'
  import ExternalLink from '@lucide/svelte/icons/external-link'
  import StatusIcon from './StatusIcon.svelte'
  import RefChip from './RefChip.svelte'
  import RelativeTime from './RelativeTime.svelte'

  let {
    pipeline,
    name,
    dense = false
  }: { pipeline: Pipeline; name: string; dense?: boolean } = $props()

  const headline = $derived(pipeline.isDefaultBranch && pipeline.status === 'failed')
</script>

<a
  class="row"
  class:dense
  class:headline
  data-status={pipeline.status}
  href={pipeline.webUrl}
  target="_blank"
  rel="noopener noreferrer"
>
  <StatusIcon status={pipeline.status} size={dense ? 18 : 20} />

  <span class="main">
    <span class="name">{name}</span>
    <span class="meta">
      <RefChip ref={pipeline.ref} />
      <span class="sep" aria-hidden="true"></span>
      <RelativeTime iso={pipeline.updatedAt} />
    </span>
  </span>

  <span class="go"><ExternalLink size={14} aria-hidden="true" /></span>
</a>

<style>
  .row {
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    gap: 10px;
    padding: 10px 14px;
    border-bottom: 1px solid var(--border);
    color: inherit;
    text-decoration: none;
    transition: background 0.1s;
  }
  .row:hover {
    background: var(--hover);
  }
  .row.dense {
    padding: 7px 14px;
  }
  .row[data-status='failed'] {
    box-shadow: inset 2px 0 0 var(--failed);
  }
  .row[data-status='running'] {
    box-shadow: inset 2px 0 0 var(--running);
  }
  .row.headline {
    background: var(--failed-bg);
    box-shadow: inset 3px 0 0 var(--failed);
  }
  .main {
    min-width: 0;
  }
  .name {
    display: block;
    overflow: hidden;
    font-weight: 600;
    font-size: 13px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .meta {
    display: flex;
    align-items: center;
    gap: 7px;
    min-width: 0;
    margin-top: 2px;
  }
  .sep {
    flex: none;
    width: 2px;
    height: 2px;
    background: var(--text-3);
    border-radius: 50%;
  }
  .go {
    justify-self: end;
    color: var(--text-3);
    opacity: 0;
    transition: opacity 0.12s;
  }
  .row:hover .go {
    opacity: 1;
  }
</style>
