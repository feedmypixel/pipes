<script lang="ts">
  import RefreshCw from '@lucide/svelte/icons/refresh-cw'
  import Settings from '@lucide/svelte/icons/settings'
  import { groupByOwner, filterGroups, ALL_BRANCH_STATES } from '../lib/group'
  import type { PipelineStatus } from '../providers/types'
  import { SvelteSet } from 'svelte/reactivity'
  import FilterBar from '../lib/components/FilterBar.svelte'
  import RepoList from '../lib/components/RepoList.svelte'
  import TopAlerts from '../lib/components/TopAlerts.svelte'
  import UpdatedFooter from '../lib/components/UpdatedFooter.svelte'
  import { useDashboard } from '../lib/dashboard.svelte'
  import browser from '../lib/browser'

  const dash = useDashboard()
  let search = $state('')
  const allowed = new SvelteSet<PipelineStatus>(readAllowed())

  // Scope: show everyone's PRs/MRs, or just the ones I opened. Panel-local, like the status pills.
  type Scope = 'all' | 'mine'
  let scope = $state<Scope>(localStorage.getItem('pipes-scope') === 'mine' ? 'mine' : 'all')
  $effect(() => localStorage.setItem('pipes-scope', scope))
  const mineOnly = $derived(scope === 'mine')

  // View prefs are panel-local, so they live in localStorage, not chrome.storage.
  function readAllowed(): PipelineStatus[] {
    const saved = localStorage.getItem('pipes-branch-states')
    if (!saved) {
      return [...ALL_BRANCH_STATES]
    }
    try {
      return JSON.parse(saved) as PipelineStatus[]
    } catch {
      return [...ALL_BRANCH_STATES]
    }
  }
  $effect(() => localStorage.setItem('pipes-branch-states', JSON.stringify([...allowed])))

  const matched = $derived(
    dash.watchedRepos.filter((repo) =>
      repo.name.toLowerCase().includes(search.trim().toLowerCase())
    )
  )
  const groups = $derived(
    filterGroups(
      groupByOwner(matched, dash.snapshots, dash.accounts, dash.viewerLogins),
      allowed,
      mineOnly
    )
  )

  function openOptions() {
    browser.runtime.openOptionsPage()
  }
</script>

<div class="panel">
  <header class="bar">
    <span class="wordmark">Pipes</span>
    <span class="live"><span class="pulse"></span> live · 10s</span>
    <button
      class="icon-button"
      class:spinning={dash.refreshing}
      title="Refresh now"
      aria-label="Refresh now"
      onclick={dash.refresh}
    >
      <RefreshCw size={16} />
    </button>
    <button class="icon-button" title="Options" aria-label="Options" onclick={openOptions}>
      <Settings size={16} />
    </button>
  </header>

  <TopAlerts
    connectionIssues={dash.connectionIssues}
    rateLimited={dash.rateLimited}
    mainFailing={dash.mainFailing}
    ready={dash.configured && dash.watchedRepos.length > 0}
    onOpenSettings={openOptions}
  />

  {#if !dash.configured || dash.watchedRepos.length === 0}
    <div class="empty">
      <p>{dash.configured ? 'No repositories watched yet.' : 'No connections yet.'}</p>
      <button class="empty-action" onclick={openOptions}>
        {dash.configured ? 'Choose repos' : 'Open setup'}
      </button>
    </div>
  {:else}
    <FilterBar bind:search bind:scope {allowed} />

    <main class="list">
      <RepoList {groups} {allowed} {mineOnly} storageKey="pipes" />
      {#if groups.length === 0}
        <p class="empty-filter">
          {#if allowed.size === 0}
            Select a branch state to show pipelines
          {:else if search.trim()}
            No repositories match “{search}”
          {:else}
            Nothing matches the current filters
          {/if}
        </p>
      {/if}
    </main>
    <UpdatedFooter lastPolledAt={dash.lastPolledAt} configured={dash.configured} />
  {/if}
</div>

<style>
  .panel {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    background: var(--bg);
    color: var(--text);
  }
  .bar {
    position: sticky;
    top: 0;
    z-index: 1;
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    padding: var(--space-sm) var(--space-md);
    background: var(--appbar);
    color: var(--appbar-text);
    border-bottom: 1px solid var(--border);
  }
  .wordmark {
    font-weight: var(--weight-heavy);
  }
  .live {
    margin-left: auto;
    display: inline-flex;
    align-items: center;
    gap: var(--space-xs);
    font: var(--weight-medium) var(--font-size-2xs) / var(--leading-none) var(--font-mono);
    color: var(--appbar-muted);
  }
  .pulse {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--success);
    animation: live-pulse 1.6s ease-in-out infinite;
  }
  @keyframes live-pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.35;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .pulse {
      animation: none;
    }
  }
  .icon-button {
    display: grid;
    place-items: center;
    width: 28px;
    height: 28px;
    border: 0;
    border-radius: var(--radius);
    background: transparent;
    color: var(--appbar-muted);
    cursor: pointer;
  }
  .icon-button:hover {
    background: var(--appbar-hover);
    color: var(--appbar-text);
  }
  .icon-button.spinning :global(svg) {
    animation: spin 0.8s linear infinite;
  }
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .icon-button.spinning :global(svg) {
      animation: none;
    }
  }

  .list {
    flex: 1;
    overflow-y: auto;
  }
  .empty {
    padding: var(--space-5xl) var(--space-4xl);
    text-align: center;
  }
  .empty p {
    margin: 0 0 var(--space-lg);
    color: var(--text-2);
    font-size: var(--font-size-base);
  }
  .empty-action {
    padding: var(--space-md) var(--space-2xl);
    border: 0;
    border-radius: var(--radius);
    background: var(--brand);
    color: var(--brand-ink);
    font: var(--weight-semibold) var(--font-size-base) / var(--leading-none) var(--font-sans);
    cursor: pointer;
  }
  .empty-filter {
    padding: var(--space-lg) var(--space-md);
    color: var(--text-3);
    font-size: var(--font-size-base);
  }
</style>
