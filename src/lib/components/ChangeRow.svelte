<script lang="ts">
  import type { Change } from '../../providers/types'
  import GitPullRequest from '@lucide/svelte/icons/git-pull-request'
  import GitBranch from '@lucide/svelte/icons/git-branch'
  import StatusIcon from './StatusIcon.svelte'
  import RelativeTime from './RelativeTime.svelte'

  let { change }: { change: Change } = $props()
</script>

<a
  class="row"
  class:draft={change.isDraft}
  data-status={change.status}
  href={change.webUrl}
  target="_blank"
  rel="noopener noreferrer"
  title={change.title}
>
  <StatusIcon status={change.status} size={16} />
  <span class="ref">
    <GitPullRequest class="pr-mark" size={12} aria-hidden="true" />
    <span class="number">#{change.number}</span>
    <span class="name">{change.title}</span>
  </span>
  <span class="branch">
    <GitBranch size={11} aria-hidden="true" />
    <span class="branch-name">{change.headRef}</span>
  </span>
  {#if change.updatedAt}
    <RelativeTime iso={change.updatedAt} />
  {/if}
</a>

<style>
  .row {
    display: grid;
    grid-template-columns: auto 1fr auto auto;
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
  .ref {
    display: inline-flex;
    align-items: center;
    gap: var(--space-xs);
    min-width: 0;
    color: var(--text-2);
  }
  .ref :global(.pr-mark) {
    flex: none;
    opacity: 1;
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
    font: var(--weight-medium) var(--font-size-base) / var(--leading-none) var(--font-sans);
    color: var(--text);
  }
  .row:hover .name {
    text-decoration: underline;
    text-underline-offset: 2px;
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
    font: var(--weight-regular) var(--font-size-xs) / var(--leading-none) var(--font-mono);
  }
</style>
