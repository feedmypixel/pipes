<script lang="ts">
  import RefreshCw from '@lucide/svelte/icons/refresh-cw'
  import Settings from '@lucide/svelte/icons/settings'
  import Search from '@lucide/svelte/icons/search'
  import ChevronRight from '@lucide/svelte/icons/chevron-right'
  import * as storage from '../lib/storage'
  import type { Snapshots } from '../lib/storage'
  import {
    groupByOwner,
    sortGroups,
    visibleBranches,
    ALL_BRANCH_STATES,
    countDefaultBranchFailures,
    type SortMode
  } from '../lib/group'
  import type { Account, PipelineStatus, Repo } from '../providers/types'
  import { SvelteSet } from 'svelte/reactivity'
  import Row from '../lib/components/Row.svelte'

  const BRANCH_STATES: PipelineStatus[] = [
    'failed',
    'running',
    'pending',
    'success',
    'canceled',
    'skipped'
  ]

  const POLL_INTERVAL_MS = 10_000

  let accounts = $state<Account[]>([])
  let watchedRepos = $state<Repo[]>([])
  let snapshots = $state<Snapshots>({})
  let search = $state('')
  let sort = $state<SortMode>(readSort())
  let collapsed = $state<Record<string, boolean>>(readCollapsed())
  const allowed = new SvelteSet<PipelineStatus>(readAllowed())

  // View prefs are panel-local, so they live in localStorage, not chrome.storage.
  function readSort(): SortMode {
    return localStorage.getItem('pipes-sort') === 'name' ? 'name' : 'status'
  }
  function readCollapsed(): Record<string, boolean> {
    try {
      return JSON.parse(localStorage.getItem('pipes-collapsed') ?? '{}')
    } catch {
      return {}
    }
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
  $effect(() => localStorage.setItem('pipes-collapsed', JSON.stringify(collapsed)))
  $effect(() => localStorage.setItem('pipes-branch-states', JSON.stringify([...allowed])))

  function toggleState(state: PipelineStatus) {
    if (allowed.has(state)) {
      allowed.delete(state)
    } else {
      allowed.add(state)
    }
  }

  $effect(() => {
    storage.get('accounts').then((value) => (accounts = value))
    storage.get('watchedRepos').then((value) => (watchedRepos = value))
    storage.get('snapshots').then((value) => (snapshots = value))
    const unsubscribers = [
      storage.subscribe('accounts', (value) => (accounts = value)),
      storage.subscribe('watchedRepos', (value) => (watchedRepos = value)),
      storage.subscribe('snapshots', (value) => (snapshots = value))
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
  const groups = $derived(sortGroups(groupByOwner(matched, snapshots), sort))
  const mainFailing = $derived(countDefaultBranchFailures(watchedRepos, snapshots))
  const configured = $derived(accounts.length > 0)
  const allHealthy = $derived(configured && watchedRepos.length > 0 && mainFailing === 0)

  function pollNow() {
    chrome.runtime.sendMessage({ type: 'poll-now' })
  }
  function openOptions() {
    chrome.runtime.openOptionsPage()
  }
</script>

<div class="panel">
  <header class="bar">
    <div class="health">
      {#if mainFailing > 0}
        <span class="dot failing"></span>
        <strong>{mainFailing} failing on main</strong>
      {:else if allHealthy}
        <span class="dot ok"></span>
        <span>All clear</span>
      {:else}
        <span class="wordmark">Pipes</span>
      {/if}
    </div>
    <span class="live"><span class="ring"></span> live · 10s</span>
    <button class="icon-button" title="Refresh now" aria-label="Refresh now" onclick={pollNow}>
      <RefreshCw size={16} />
    </button>
    <button class="icon-button" title="Options" aria-label="Options" onclick={openOptions}>
      <Settings size={16} />
    </button>
  </header>

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
      </span>
      <div class="segmented" role="group" aria-label="Sort">
        <button class:active={sort === 'name'} onclick={() => (sort = 'name')}>Name</button>
        <button class:active={sort === 'status'} onclick={() => (sort = 'status')}>Status</button>
      </div>
    </div>
    <div class="filters" role="group" aria-label="Show branch states">
      {#each BRANCH_STATES as state (state)}
        <button
          class="chip {state}"
          class:on={allowed.has(state)}
          aria-pressed={allowed.has(state)}
          onclick={() => toggleState(state)}
        >
          {state}
        </button>
      {/each}
    </div>

    <main class="list">
      {#each groups as group (group.owner)}
        <section>
          <button
            class="owner"
            aria-expanded={!collapsed[group.owner]}
            onclick={() => (collapsed[group.owner] = !collapsed[group.owner])}
          >
            <ChevronRight class="caret" size={13} />
            <span class="owner-name">{group.owner}</span>
            <span class="count">{group.repos.length}</span>
          </button>
          {#if !collapsed[group.owner]}
            {#each group.repos as view (view.repo.id)}
              {#if view.primary}
                <Row name={view.displayName} pipeline={view.primary} dense />
              {/if}
              {#each visibleBranches(view, allowed) as branch (branch.id)}
                <Row name={view.displayName} pipeline={branch} child />
              {/each}
            {/each}
          {/if}
        </section>
      {/each}
      {#if groups.length === 0}
        <p class="empty-filter">No repositories match “{search}”</p>
      {/if}
    </main>
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
    border-bottom: 2px solid var(--brand);
  }
  .health {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    font-size: var(--font-size-base);
  }
  .wordmark {
    font-weight: var(--weight-heavy);
  }
  .dot {
    width: 9px;
    height: 9px;
    border-radius: 50%;
    flex: none;
  }
  .dot.failing {
    background: var(--failed);
  }
  .dot.ok {
    background: var(--success);
  }
  .live {
    margin-left: auto;
    display: inline-flex;
    align-items: center;
    gap: var(--space-xs);
    font: var(--weight-medium) var(--font-size-2xs) / var(--leading-none) var(--font-mono);
    color: var(--appbar-muted);
  }
  .ring {
    width: 8px;
    height: 8px;
    border: 1.6px solid var(--success);
    border-right-color: transparent;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .ring {
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

  .controls {
    display: flex;
    gap: var(--space-sm);
    padding: var(--space-sm) var(--space-md);
    border-bottom: 1px solid var(--border);
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
  .segmented {
    display: inline-flex;
    flex: none;
    border: 1px solid var(--border-2);
    border-radius: var(--radius);
    overflow: hidden;
  }
  .segmented button {
    padding: var(--space-xs) var(--space-md);
    border: 0;
    background: var(--surface);
    color: var(--text-2);
    font: var(--weight-semibold) var(--font-size-xs) / var(--leading-none) var(--font-sans);
    cursor: pointer;
  }
  .segmented button + button {
    border-left: 1px solid var(--border-2);
  }
  .segmented button:hover {
    background: var(--hover);
  }
  .segmented button.active {
    background: var(--brand);
    color: var(--brand-ink);
  }

  .filters {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-xs);
    padding: var(--space-sm) var(--space-md);
    border-bottom: 1px solid var(--border);
  }
  .chip {
    padding: var(--space-xs) var(--space-md);
    border: 1px solid var(--border-2);
    border-radius: var(--radius);
    background: transparent;
    color: var(--text-3);
    font: var(--weight-semibold) var(--font-size-sm) / var(--leading-none) var(--font-sans);
    text-transform: capitalize;
    cursor: pointer;
  }
  .chip:hover {
    background: var(--hover);
  }
  .chip.on {
    background: var(--hover);
    color: var(--text);
    border-color: var(--text-3);
  }

  .list {
    flex: 1;
    overflow-y: auto;
  }
  .owner {
    position: sticky;
    top: 0;
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    width: 100%;
    padding: var(--space-xs) var(--space-md);
    border: 0;
    border-bottom: 1px solid var(--border);
    background: var(--surface);
    color: var(--text-2);
    cursor: pointer;
  }
  .owner :global(.caret) {
    flex: none;
    transition: transform 0.12s;
  }
  .owner[aria-expanded='true'] :global(.caret) {
    transform: rotate(90deg);
  }
  @media (prefers-reduced-motion: reduce) {
    .owner :global(.caret) {
      transition: none;
    }
  }
  .owner-name {
    font: var(--weight-bold) var(--font-size-2xs) / var(--leading-none) var(--font-mono);
    letter-spacing: 0.07em;
  }
  .count {
    margin-left: auto;
    font: var(--weight-semibold) var(--font-size-2xs) / var(--leading-none) var(--font-mono);
    color: var(--text-3);
    border: 1px solid var(--border);
    border-radius: var(--radius-pill);
    padding: var(--space-3xs) var(--space-sm);
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
