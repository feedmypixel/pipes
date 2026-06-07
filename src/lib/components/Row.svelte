<script lang="ts">
  import type { Pipeline } from '../../providers/types'
  import GitBranch from '@lucide/svelte/icons/git-branch'
  import Star from '@lucide/svelte/icons/star'
  import StatusIcon from './StatusIcon.svelte'
  import RelativeTime from './RelativeTime.svelte'
  import { statusVisual } from './status-icon'
  import { tooltip } from '../tooltip'

  let { pipeline }: { pipeline: Pipeline } = $props()

  let label = $derived(
    `${pipeline.ref}${pipeline.isDefaultBranch ? ' (default branch)' : ''}, ${statusVisual(pipeline.status).label}`
  )
</script>

<a
  class="row"
  data-status={pipeline.status}
  href={pipeline.webUrl}
  target="_blank"
  rel="noopener noreferrer"
  aria-label={label}
>
  <StatusIcon status={pipeline.status} size={16} />
  <span class="ref">
    {#if pipeline.isDefaultBranch}
      <Star class="default-mark" size={12} aria-label="Default branch" />
    {:else}
      <GitBranch class="branch-mark" size={12} aria-hidden="true" />
    {/if}
    <span class="name" use:tooltip={pipeline.title}>{pipeline.ref}</span>
  </span>
  <RelativeTime iso={pipeline.updatedAt} />
</a>

<style>
  .row {
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    gap: var(--space-md);
    /* indented: these rows always sit under a repo-name header */
    padding: var(--space-sm) var(--space-xl) var(--space-sm) var(--space-3xl);
    border-bottom: 1px solid var(--border);
    color: inherit;
    text-decoration: none;
    transition: background 0.1s;
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
    font: var(--weight-medium) var(--font-size-base) / var(--leading-none) var(--font-mono);
    color: var(--text);
  }
  .row:hover .name {
    text-decoration: underline;
    text-underline-offset: 2px;
  }
</style>
