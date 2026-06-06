<script lang="ts">
  import type { Pipeline } from '../../providers/types'
  import ExternalLink from '@lucide/svelte/icons/external-link'
  import StatusIcon from './StatusIcon.svelte'
  import RefChip from './RefChip.svelte'
  import RelativeTime from './RelativeTime.svelte'

  let {
    pipeline,
    name,
    dense = false,
    child = false
  }: { pipeline: Pipeline; name: string; dense?: boolean; child?: boolean } = $props()

  const headline = $derived(pipeline.isDefaultBranch && pipeline.status === 'failed')
</script>

<a
  class="row"
  class:dense
  class:child
  class:headline
  data-status={pipeline.status}
  href={pipeline.webUrl}
  target="_blank"
  rel="noopener noreferrer"
>
  <StatusIcon status={pipeline.status} size={dense || child ? 18 : 20} />

  {#if child}
    <span class="branch"><RefChip ref={pipeline.ref} /></span>
    <RelativeTime iso={pipeline.updatedAt} />
  {:else}
    <span class="main">
      <span class="name">{name}</span>
      <span class="meta">
        <RefChip ref={pipeline.ref} />
        <span class="separator" aria-hidden="true"></span>
        <RelativeTime iso={pipeline.updatedAt} />
      </span>
    </span>
    <span class="external"><ExternalLink size={14} aria-hidden="true" /></span>
  {/if}
</a>

<style>
  .row {
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    gap: var(--space-md);
    padding: var(--space-md) var(--space-xl);
    border-bottom: 1px solid var(--border);
    color: inherit;
    text-decoration: none;
    transition: background 0.1s;
  }
  .row:hover {
    background: var(--hover);
  }
  .row.dense {
    padding: var(--space-sm) var(--space-xl);
  }
  .row.child {
    /* 40px left = parent padding + icon + gap, so the child branch aligns under the name */
    padding: var(--space-sm) var(--space-xl) var(--space-sm) 40px;
    background: var(--surface-2);
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
    font-weight: var(--weight-semibold);
    font-size: var(--font-size-base);
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .meta {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    min-width: 0;
    margin-top: var(--space-3xs);
  }
  .branch {
    min-width: 0;
  }
  .separator {
    flex: none;
    width: 2px;
    height: 2px;
    background: var(--text-3);
    border-radius: 50%;
  }
  .external {
    justify-self: end;
    color: var(--text-3);
    opacity: 0;
    transition: opacity 0.12s;
  }
  .row:hover .external {
    opacity: 1;
  }
</style>
