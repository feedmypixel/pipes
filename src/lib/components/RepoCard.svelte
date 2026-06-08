<script lang="ts">
  import ChevronRight from '@lucide/svelte/icons/chevron-right'
  import ExternalLink from '@lucide/svelte/icons/external-link'
  import GitPullRequest from '@lucide/svelte/icons/git-pull-request'
  import type { RepoView } from '../group'
  import { visibleChanges, defaultVisible, failingCount } from '../group'
  import type { PipelineStatus } from '../../providers/types'
  import { tooltip } from '../tooltip'
  import Row from './Row.svelte'
  import ChangeRow from './ChangeRow.svelte'

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

  // Open PRs/MRs collapse into the drawer; the default branch is always shown.
  const changes = $derived(visibleChanges(view, allowed))
  const showDefault = $derived(defaultVisible(view, allowed))
  const hasChanges = $derived(changes.length > 0)
  const failing = $derived(failingCount(view))

  const count = $derived(view.changes.length)
  const changeNoun = $derived(view.providerId === 'gitlab' ? 'merge request' : 'pull request')
  const changeTooltip = $derived(`${count} open ${changeNoun}${count === 1 ? '' : 's'}`)

  // A repo with no open PRs/MRs has nothing to expand, so it's a plain header, not a
  // disabled button (no-disabled-buttons: never-applicable shouldn't render the affordance).
  const canToggle = $derived(hasChanges && Boolean(onToggle))
</script>

{#snippet head()}
  <span class="caret">
    {#if canToggle}<ChevronRight size={16} />{/if}
  </span>
  <span class="repo-name">{view.displayName}</span>
  {#if view.changes.length > 0}
    <span class="pr-count" use:tooltip={changeTooltip}>
      <GitPullRequest size={12} />
      {view.changes.length}
    </span>
  {/if}
{/snippet}

<div class="repo">
  <div class="repo-head">
    {#if canToggle}
      <button
        class="repo-toggle"
        class:open={!collapsed}
        aria-expanded={!collapsed}
        onclick={onToggle}
      >
        {@render head()}
      </button>
    {:else}
      <div class="repo-toggle">{@render head()}</div>
    {/if}
    {#if failing > 0}
      <span class="fail-badge" use:tooltip={`${failing} failing`}>{failing}</span>
    {/if}
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

  {#if view.default && showDefault}
    <Row pipeline={view.default} />
  {/if}
  {#if !collapsed}
    {#each changes as change (change.number)}
      <ChangeRow {change} />
    {/each}
  {/if}
</div>

<style>
  .repo-head {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    padding-right: var(--space-md);
  }
  .repo-toggle {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    padding: var(--space-sm) var(--space-xs) var(--space-2xs) var(--space-sm);
    border: 0;
    background: transparent;
    cursor: pointer;
    text-align: left;
  }
  div.repo-toggle {
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
    flex: 0 1 auto;
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
  .pr-count {
    flex: none;
    display: inline-flex;
    align-items: center;
    gap: var(--space-3xs);
    margin-left: var(--space-xs);
    color: var(--text-3);
    font: var(--weight-medium) var(--font-size-xs) / 1 var(--font-mono);
  }
  .pr-count :global(svg) {
    flex: none;
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
