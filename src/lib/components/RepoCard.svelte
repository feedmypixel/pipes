<script lang="ts">
  import ChevronRight from '@lucide/svelte/icons/chevron-right'
  import ExternalLink from '@lucide/svelte/icons/external-link'
  import type { RepoView } from '../group'
  import { visibleBranches, primaryVisible, failingCount } from '../group'
  import type { PipelineStatus } from '../../providers/types'
  import Row from './Row.svelte'

  let {
    view,
    allowed,
    collapsed = false,
    onToggle
  }: {
    view: RepoView
    allowed: ReadonlySet<PipelineStatus>
    collapsed?: boolean
    onToggle?: () => void
  } = $props()

  // Non-default branches collapse into the drawer; the default branch is always shown.
  const branches = $derived(visibleBranches(view, allowed))
  const showPrimary = $derived(primaryVisible(view, allowed))
  const hasBranches = $derived(branches.length > 0)
  const failing = $derived(failingCount(view))
</script>

<div class="repo">
  <div class="repo-head">
    <button
      class="repo-toggle"
      class:open={!collapsed}
      aria-expanded={hasBranches ? !collapsed : undefined}
      disabled={!hasBranches || !onToggle}
      onclick={onToggle}
    >
      <span class="caret">
        {#if hasBranches}<ChevronRight size={16} />{/if}
      </span>
      <span class="repo-name">{view.displayName}</span>
      {#if failing > 0}
        <span class="fail-badge" title="{failing} failing">{failing}</span>
      {/if}
    </button>
    <a
      class="repo-link"
      href={view.repo.webUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Open {view.displayName} on the provider"
    >
      <ExternalLink size={13} />
    </a>
  </div>

  {#if view.primary && showPrimary}
    <Row pipeline={view.primary} />
  {/if}
  {#if !collapsed}
    {#each branches as branch (branch.id)}
      <Row pipeline={branch} />
    {/each}
  {/if}
</div>

<style>
  .repo-head {
    display: flex;
    align-items: center;
    padding-right: var(--space-md);
  }
  .repo-toggle {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    padding: var(--space-sm) var(--space-xs) var(--space-sm) var(--space-sm);
    border: 0;
    background: transparent;
    cursor: pointer;
    text-align: left;
  }
  .repo-toggle:disabled {
    cursor: default;
  }
  .caret {
    flex: none;
    display: grid;
    place-items: center;
    width: 16px;
    height: 16px;
    color: var(--text-3);
    transition: transform 0.12s;
  }
  .repo-toggle.open .caret {
    transform: rotate(90deg);
  }
  .repo-name {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-weight: var(--weight-bold);
    font-size: var(--font-size-lg);
    color: var(--text);
  }
  .fail-badge {
    flex: none;
    display: inline-grid;
    place-items: center;
    min-width: 20px;
    height: 20px;
    padding: 0 var(--space-2xs);
    border-radius: var(--radius-pill);
    background: var(--failed);
    color: var(--status-ink);
    font: var(--weight-bold) var(--font-size-2xs) / 1 var(--font-mono);
  }
  .repo-link {
    flex: none;
    display: grid;
    place-items: center;
    width: 24px;
    height: 24px;
    border-radius: var(--radius-pill);
    color: var(--text-3);
  }
  .repo-link:hover {
    background: var(--hover);
    color: var(--text);
  }
  @media (prefers-reduced-motion: reduce) {
    .caret {
      transition: none;
    }
  }
</style>
