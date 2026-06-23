<script lang="ts">
  import type { Change } from '../../providers/types'
  import GitPullRequest from '@lucide/svelte/icons/git-pull-request'
  import GitBranch from '@lucide/svelte/icons/git-branch'
  import StatusIcon from './StatusIcon.svelte'
  import RelativeTime from './RelativeTime.svelte'
  import ElapsedTime from './ElapsedTime.svelte'
  import Author from './Author.svelte'
  import { statusVisual } from './status-icon'

  let { change }: { change: Change } = $props()

  let label = $derived(
    `#${change.number} ${change.title} on ${change.headRef}, ${statusVisual(change.status).label}${change.isDraft ? ', draft' : ''}`
  )
</script>

<div class="row" class:draft={change.isDraft} data-status={change.status}>
  <a
    class="r-link"
    href={change.webUrl}
    target="_blank"
    rel="noopener noreferrer"
    title={`${change.title}\n${change.headRef}`}
    aria-label={label}
  ></a>
  <StatusIcon status={change.status} size={16} />
  <div class="sub-body">
    <div class="sub-title">
      <GitPullRequest class="pr-mark" size={12} aria-hidden="true" />
      <span class="number">#{change.number}</span>
      <span class="name">{change.title}</span>
    </div>
    <div class="sub-meta">
      <span class="branch">
        <GitBranch size={11} aria-hidden="true" />
        <span class="branch-name">{change.headRef}</span>
      </span>
      <span class="meta-end">
        <Author author={change.attribution} dense />
        {#if change.status === 'running' && change.startedAt}
          <ElapsedTime startedAt={change.startedAt} />
        {:else if change.updatedAt}
          <RelativeTime iso={change.updatedAt} />
        {/if}
      </span>
    </div>
  </div>
</div>

<style>
  .row {
    position: relative;
    display: grid;
    grid-template-columns: auto 1fr;
    align-items: start;
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
  .row.draft {
    opacity: 0.55;
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
  .sub-body {
    display: flex;
    flex-direction: column;
    gap: var(--space-2xs);
    min-width: 0;
  }
  .sub-title {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    min-width: 0;
    color: var(--text-2);
  }
  .sub-title :global(.pr-mark) {
    flex: none;
    color: var(--text-2);
  }
  .number {
    flex: none;
    font: var(--weight-medium) var(--font-size-sm) / var(--leading-none) var(--font-mono);
    color: var(--text-3);
  }
  .name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font: var(--weight-medium) var(--font-size-base) / var(--leading-tight) var(--font-sans);
    color: var(--text);
  }
  .row:hover .name {
    text-decoration: underline;
    text-underline-offset: 2px;
  }
  .sub-meta {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    min-width: 0;
  }
  .branch {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2xs);
    min-width: 0;
    max-width: 9rem;
    color: var(--text-3);
  }
  .branch :global(svg) {
    flex: none;
  }
  .branch-name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font: var(--weight-regular) var(--font-size-xs) / var(--leading-tight) var(--font-mono);
  }
  .meta-end {
    margin-left: auto;
    display: inline-flex;
    align-items: center;
    gap: var(--space-sm);
    flex: none;
  }
</style>
