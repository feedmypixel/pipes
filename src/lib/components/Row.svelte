<script lang="ts">
  import type { Pipeline } from '../../providers/types'
  import GitBranch from '@lucide/svelte/icons/git-branch'
  import Star from '@lucide/svelte/icons/star'
  import StatusIcon from './StatusIcon.svelte'
  import RelativeTime from './RelativeTime.svelte'
  import ElapsedTime from './ElapsedTime.svelte'
  import Author from './Author.svelte'
  import { statusVisual } from './status-icon'
  import { tooltip } from '../tooltip'

  let { pipeline }: { pipeline: Pipeline } = $props()

  let label = $derived(
    `${pipeline.ref}${pipeline.isDefaultBranch ? ' (default branch)' : ''}, ${statusVisual(pipeline.status).label}`
  )
</script>

<div class="row" data-status={pipeline.status}>
  <a
    class="r-link"
    href={pipeline.webUrl}
    target="_blank"
    rel="noopener noreferrer"
    title={pipeline.title}
    aria-label={label}
  ></a>
  <StatusIcon status={pipeline.status} size={16} />
  <span class="ref">
    {#if pipeline.isDefaultBranch}
      <span class="mark" use:tooltip={'Default branch'}>
        <Star class="default-mark" size={12} aria-hidden="true" />
      </span>
    {:else}
      <GitBranch class="branch-mark" size={12} aria-hidden="true" />
    {/if}
    <span class="name">{pipeline.ref}</span>
  </span>
  <span class="meta-end">
    {#if pipeline.status === 'running' && pipeline.startedAt}
      <ElapsedTime startedAt={pipeline.startedAt} />
    {:else}
      <RelativeTime iso={pipeline.updatedAt} />
    {/if}
    <Author author={pipeline.attribution} />
  </span>
</div>

<style>
  .row {
    position: relative;
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    gap: var(--space-md);
    /* indented: these rows always sit under a repo-name header */
    padding: var(--space-md) var(--space-xl) var(--space-md) var(--space-3xl);
    border-bottom: 1px solid var(--border);
    transition: background 0.1s;
  }
  .r-link {
    position: absolute;
    inset: 0;
    z-index: 0;
  }
  .row:hover {
    background: var(--hover);
  }
  .row[data-status='failed'] {
    box-shadow: inset 2px 0 0 var(--failed);
    background: var(--failed-bg);
  }
  .row[data-status='running'] {
    box-shadow: inset 2px 0 0 var(--running);
  }
  .row:has(.r-link:focus-visible) {
    outline: 2px solid var(--brand);
    outline-offset: -2px;
  }
  .mark {
    display: inline-flex;
    flex: none;
    align-items: center;
  }
  .ref {
    display: inline-flex;
    align-items: center;
    gap: var(--space-xs);
    min-width: 0;
    color: var(--text-2);
  }
  .ref :global(svg) {
    flex: none;
    opacity: 0.6;
  }
  .ref :global(.default-mark) {
    fill: var(--star);
    opacity: 1;
    color: var(--star);
  }
  .ref :global(.branch-mark) {
    opacity: 1;
    color: var(--text-2);
  }
  .name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font: var(--weight-medium) var(--font-size-base) / var(--leading-tight) var(--font-mono);
    color: var(--text);
  }
  .row:hover .name {
    text-decoration: underline;
    text-underline-offset: 2px;
  }
  .meta-end {
    display: inline-flex;
    align-items: center;
    gap: var(--space-sm);
  }
</style>
