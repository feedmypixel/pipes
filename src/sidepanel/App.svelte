<script lang="ts">
  import RefreshCw from '@lucide/svelte/icons/refresh-cw'
  import Settings from '@lucide/svelte/icons/settings'
  import Search from '@lucide/svelte/icons/search'
  import X from '@lucide/svelte/icons/x'
  import * as storage from '../lib/storage'
  import type { Snapshots, AccountHealth } from '../lib/storage'
  import {
    groupByOwner,
    sortGroups,
    filterGroups,
    ALL_BRANCH_STATES,
    BRANCH_STATE_ORDER,
    countDefaultBranchFailures,
    type SortMode
  } from '../lib/group'
  import type { Account, PipelineStatus, Repo } from '../providers/types'
  import { SvelteSet } from 'svelte/reactivity'
  import RepoList from '../lib/components/RepoList.svelte'
  import TopAlerts from '../lib/components/TopAlerts.svelte'
  import UpdatedFooter from '../lib/components/UpdatedFooter.svelte'

  const POLL_INTERVAL_MS = 10_000

  let accounts = $state<Account[]>([])
  let watchedRepos = $state<Repo[]>([])
  let snapshots = $state<Snapshots>({})
  let accountHealth = $state<Record<string, AccountHealth>>({})
  let search = $state('')
  let lastPolledAt = $state(0)
  let refreshing = $state(false)
  let sort = $state<SortMode>(readSort())
  const allowed = new SvelteSet<PipelineStatus>(readAllowed())

  // View prefs are panel-local, so they live in localStorage, not chrome.storage.
  function readSort(): SortMode {
    return localStorage.getItem('pipes-sort') === 'name' ? 'name' : 'status'
  }
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
  $effect(() => localStorage.setItem('pipes-sort', sort))
  $effect(() => localStorage.setItem('pipes-branch-states', JSON.stringify([...allowed])))

  function toggleState(state: PipelineStatus) {
    if (allowed.has(state)) {
      allowed.delete(state)
    } else {
      allowed.add(state)
    }
  }

  function toggleAll() {
    const turnOn = !BRANCH_STATE_ORDER.every((state) => allowed.has(state))
    for (const state of BRANCH_STATE_ORDER) {
      if (turnOn) {
        allowed.add(state)
      } else {
        allowed.delete(state)
      }
    }
  }

  $effect(() => {
    storage.get('accounts').then((value) => (accounts = value))
    storage.get('watchedRepos').then((value) => (watchedRepos = value))
    storage.get('snapshots').then((value) => (snapshots = value))
    storage.get('accountHealth').then((value) => (accountHealth = value))
    storage.get('lastPolledAt').then((value) => (lastPolledAt = value))
    const unsubscribers = [
      storage.subscribe('accounts', (value) => (accounts = value)),
      storage.subscribe('watchedRepos', (value) => (watchedRepos = value)),
      storage.subscribe('snapshots', (value) => (snapshots = value)),
      storage.subscribe('accountHealth', (value) => (accountHealth = value)),
      storage.subscribe('lastPolledAt', (value) => (lastPolledAt = value))
    ]
    return () => unsubscribers.forEach((off) => off())
  })

  // Active poll while the panel is open: ask the worker to poll on an interval.
  // The worker stays the single owner of notifications + the badge.
  $effect(() => {
    pollNow()
    const id = setInterval(pollNow, POLL_INTERVAL_MS)
    return () => clearInterval(id)
  })

  const matched = $derived(
    watchedRepos.filter((repo) => repo.name.toLowerCase().includes(search.trim().toLowerCase()))
  )
  const groups = $derived(filterGroups(sortGroups(groupByOwner(matched, snapshots), sort), allowed))
  const allStatesOn = $derived(BRANCH_STATE_ORDER.every((state) => allowed.has(state)))
  const mainFailing = $derived(countDefaultBranchFailures(watchedRepos, snapshots))
  const configured = $derived(accounts.length > 0)
  const connectionIssues = $derived(
    accounts
      .filter((account) => accountHealth[account.id] && !accountHealth[account.id].ok)
      .map((account) => ({
        id: account.id,
        label: account.label,
        error: accountHealth[account.id].error
      }))
  )

  function pollNow() {
    chrome.runtime.sendMessage({ type: 'poll-now' })
  }
  async function refresh() {
    refreshing = true
    try {
      await chrome.runtime.sendMessage({ type: 'poll-now' })
    } finally {
      refreshing = false
    }
  }
  function openOptions() {
    chrome.runtime.openOptionsPage()
  }
</script>

<div class="panel">
  <header class="bar">
    <span class="wordmark">Pipes</span>
    <span class="live"><span class="pulse"></span> live · 10s</span>
    <button
      class="icon-button"
      class:spinning={refreshing}
      title="Refresh now"
      aria-label="Refresh now"
      onclick={refresh}
    >
      <RefreshCw size={16} />
    </button>
    <button class="icon-button" title="Options" aria-label="Options" onclick={openOptions}>
      <Settings size={16} />
    </button>
  </header>

  <TopAlerts
    {connectionIssues}
    {mainFailing}
    ready={configured && watchedRepos.length > 0}
    onOpenSettings={openOptions}
  />

  {#if !configured || watchedRepos.length === 0}
    <div class="empty">
      <p>{configured ? 'No repositories watched yet.' : 'No connections yet.'}</p>
      <button class="empty-action" onclick={openOptions}>
        {configured ? 'Choose repos' : 'Open setup'}
      </button>
    </div>
  {:else}
    <div class="controls">
      <span class="search">
        <Search size={14} />
        <input type="text" placeholder="Filter repositories…" bind:value={search} />
        {#if search}
          <button class="search-clear" aria-label="Clear filter" onclick={() => (search = '')}>
            <X size={14} />
          </button>
        {/if}
      </span>
      <div class="segmented" role="group" aria-label="Sort">
        <button class:active={sort === 'name'} onclick={() => (sort = 'name')}>Name</button>
        <button class:active={sort === 'status'} onclick={() => (sort = 'status')}>Status</button>
      </div>
    </div>
    <div class="filters">
      <div class="pills" role="group" aria-label="Show branch states">
        {#each BRANCH_STATE_ORDER as state (state)}
          <button
            class="chip"
            class:on={allowed.has(state)}
            aria-pressed={allowed.has(state)}
            onclick={() => toggleState(state)}
          >
            {state}
          </button>
        {/each}
        <button class="toggle-all" onclick={toggleAll}>
          {allStatesOn ? 'Clear all' : 'Select all'}
        </button>
      </div>
    </div>

    <main class="list">
      <RepoList {groups} {allowed} storageKey="pipes" />
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
    <UpdatedFooter {lastPolledAt} {configured} />
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

  .controls {
    display: flex;
    gap: var(--space-sm);
    padding: var(--space-md) var(--space-md) var(--space-xs);
  }
  .search {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    flex: 1;
    padding: var(--space-xs) var(--space-md);
    border: 1px solid var(--border-2);
    border-radius: var(--radius);
    background: var(--bg);
  }
  .search :global(svg) {
    color: var(--text-3);
    flex: none;
  }
  .search input {
    flex: 1;
    min-width: 0;
    border: 0;
    background: transparent;
    outline: 0;
    color: var(--text);
    font: var(--weight-medium) var(--font-size-base) / var(--leading-none) var(--font-sans);
  }
  .search-clear {
    display: grid;
    place-items: center;
    flex: none;
    width: 20px;
    height: 20px;
    padding: 0;
    border: 0;
    border-radius: var(--radius-pill);
    background: transparent;
    color: var(--text-3);
    cursor: pointer;
  }
  .search-clear:hover {
    background: var(--hover);
    color: var(--text);
  }
  .segmented {
    display: inline-flex;
    flex: none;
    border: 1px solid var(--border-2);
    border-radius: var(--radius);
    overflow: hidden;
  }
  .segmented button {
    padding: var(--space-3xs) var(--space-md);
    border: 0;
    background: var(--surface);
    color: var(--text-2);
    font: var(--weight-regular) var(--font-size-xs) / var(--leading-none) var(--font-sans);
    cursor: pointer;
  }
  .segmented button + button {
    border-left: 1px solid var(--border-2);
  }
  .segmented button:hover {
    background: var(--hover);
  }
  .segmented button.active {
    background: var(--control-on);
    color: var(--control-on-ink);
  }

  .filters {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    padding: var(--space-xs) var(--space-md) var(--space-md);
    border-bottom: 1px solid var(--border);
  }
  .pills {
    display: flex;
    flex-wrap: wrap;
    gap: calc(var(--space-3xs) + 0.0625rem);
  }
  .chip {
    padding: var(--space-3xs) var(--space-md);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    background: transparent;
    color: var(--text-3);
    font: var(--weight-regular) var(--font-size-sm) / var(--leading-none) var(--font-sans);
    text-transform: capitalize;
    cursor: pointer;
  }
  .chip:hover {
    color: var(--text-2);
    border-color: var(--border-2);
  }
  .chip.on {
    background: var(--control-on);
    color: var(--control-on-ink);
    border-color: var(--control-on-edge);
    font-weight: var(--weight-medium);
  }
  .toggle-all {
    align-self: stretch;
    margin-left: var(--space-2xs);
    padding: 0 0 0 var(--space-sm);
    border: 0;
    border-left: 1px solid var(--border);
    background: transparent;
    color: var(--link);
    font: var(--weight-medium) var(--font-size-sm) / var(--leading-none) var(--font-sans);
    cursor: pointer;
  }
  .toggle-all:hover {
    text-decoration: underline;
    text-underline-offset: 2px;
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
