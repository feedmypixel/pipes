<script lang="ts">
  import RefreshCw from '@lucide/svelte/icons/refresh-cw'
  import PanelRight from '@lucide/svelte/icons/panel-right'
  import Settings from '@lucide/svelte/icons/settings'
  import * as storage from '../lib/storage'
  import type { Snapshots } from '../lib/storage'
  import {
    groupByOwner,
    visibleBranches,
    PROBLEM_STATES,
    ALL_BRANCH_STATES,
    countDefaultBranchFailures
  } from '../lib/group'
  import type { Account, Repo } from '../providers/types'
  import Row from '../lib/components/Row.svelte'

  let accounts = $state<Account[]>([])
  let watchedRepos = $state<Repo[]>([])
  let snapshots = $state<Snapshots>({})
  // Default to problems-only: the popup is a glance for "anything wrong?".
  let problemsOnly = $state(localStorage.getItem('pipes-problems-only') !== 'false')

  $effect(() => localStorage.setItem('pipes-problems-only', String(problemsOnly)))
  const branchStates = $derived(problemsOnly ? PROBLEM_STATES : ALL_BRANCH_STATES)

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

  const groups = $derived(groupByOwner(watchedRepos, snapshots))
  const mainFailing = $derived(countDefaultBranchFailures(watchedRepos, snapshots))
  const configured = $derived(accounts.length > 0)
  const allHealthy = $derived(configured && watchedRepos.length > 0 && mainFailing === 0)

  function refresh() {
    chrome.runtime.sendMessage({ type: 'poll-now' })
  }

  async function openSidePanel() {
    const win = await chrome.windows.getCurrent()
    if (win.id !== undefined) {
      await chrome.sidePanel.open({ windowId: win.id })
      window.close()
    }
  }

  function openOptions() {
    chrome.runtime.openOptionsPage()
  }
</script>

<div class="popup">
  <header class="appbar">
    <img class="logo" src="/icons/icon-32.png" alt="" width="24" height="24" />
    <span class="wordmark">Pipes</span>
    <div class="actions">
      <button class="icon-button" title="Refresh now" aria-label="Refresh now" onclick={refresh}>
        <RefreshCw size={17} />
      </button>
      <button
        class="icon-button"
        title="Open side panel"
        aria-label="Open side panel"
        onclick={openSidePanel}
      >
        <PanelRight size={17} />
      </button>
      <button class="icon-button" title="Options" aria-label="Options" onclick={openOptions}>
        <Settings size={17} />
      </button>
    </div>
  </header>

  {#if mainFailing > 0}
    <div class="alarm">
      <span class="blip"></span>
      <strong>{mainFailing} failing on main</strong>
    </div>
  {/if}

  {#if !configured}
    <div class="empty">
      <h2>No connections yet</h2>
      <p>Add a GitHub or GitLab account to start watching pipelines.</p>
      <button class="empty-action" onclick={openOptions}>Open setup</button>
    </div>
  {:else if watchedRepos.length === 0}
    <div class="empty">
      <h2>No repositories watched</h2>
      <p>Choose the repos to watch in the options.</p>
      <button class="empty-action" onclick={openOptions}>Choose repos</button>
    </div>
  {:else}
    <div class="filter-bar">
      <button
        class="toggle"
        class:on={problemsOnly}
        aria-pressed={problemsOnly}
        onclick={() => (problemsOnly = !problemsOnly)}
      >
        Problems only
      </button>
    </div>
    <main class="body">
      {#if allHealthy}
        <div class="healthy">All clear</div>
      {/if}
      {#each groups as group (group.owner)}
        <section>
          <div class="owner">
            <span class="owner-name">{group.owner}</span>
            <span class="count">{group.repos.length}</span>
          </div>
          {#each group.repos as view (view.repo.id)}
            {#if view.primary}
              <Row name={view.displayName} pipeline={view.primary} />
            {/if}
            {#each visibleBranches(view, branchStates) as branch (branch.id)}
              <Row name={view.displayName} pipeline={branch} child />
            {/each}
          {/each}
        </section>
      {/each}
    </main>
  {/if}

  <footer class="footer">
    <span class="live"><span class="ring"></span> updated just now</span>
  </footer>
</div>

<style>
  .popup {
    width: 380px;
    display: flex;
    flex-direction: column;
    background: var(--bg);
    color: var(--text);
  }

  .appbar {
    display: flex;
    align-items: center;
    gap: var(--space-md);
    padding: var(--space-md) var(--space-lg);
    background: var(--appbar);
    border-bottom: 2px solid var(--brand);
  }
  .logo {
    display: block;
    border-radius: var(--radius);
  }
  .wordmark {
    font-weight: var(--weight-heavy);
    font-size: var(--font-size-lg);
    letter-spacing: -0.01em;
    color: var(--appbar-text);
  }
  .actions {
    margin-left: auto;
    display: flex;
    gap: var(--space-3xs);
  }
  .icon-button {
    display: grid;
    place-items: center;
    width: 30px;
    height: 30px;
    border: 0;
    border-radius: var(--radius);
    background: transparent;
    color: var(--appbar-muted);
    cursor: pointer;
    transition:
      background 0.12s,
      color 0.12s;
  }
  .icon-button:hover {
    background: var(--appbar-hover);
    color: var(--appbar-text);
  }

  .alarm {
    display: flex;
    align-items: center;
    gap: var(--space-md);
    padding: var(--space-md) var(--space-xl);
    background: var(--alarm-strip);
    color: var(--alarm-ink);
    border-bottom: 1px solid var(--alarm-line);
    font-weight: var(--weight-semibold);
    font-size: var(--font-size-base);
  }
  .blip {
    width: 9px;
    height: 9px;
    border-radius: 50%;
    background: var(--failed);
    animation: pulse 2s infinite;
  }
  @keyframes pulse {
    0% {
      box-shadow: 0 0 0 0 color-mix(in srgb, var(--failed) 50%, transparent);
    }
    70% {
      box-shadow: 0 0 0 7px transparent;
    }
    100% {
      box-shadow: 0 0 0 0 transparent;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .blip {
      animation: none;
    }
  }

  .filter-bar {
    display: flex;
    padding: var(--space-sm) var(--space-lg);
    border-bottom: 1px solid var(--border);
  }
  .toggle {
    padding: var(--space-3xs) var(--space-md);
    border: 1px solid var(--border-2);
    border-radius: var(--radius-pill);
    background: transparent;
    color: var(--text-3);
    font: var(--weight-semibold) var(--font-size-2xs) / var(--leading-none) var(--font-sans);
    cursor: pointer;
  }
  .toggle.on {
    background: var(--brand);
    color: var(--brand-ink);
    border-color: var(--brand);
  }

  .body {
    max-height: 520px;
    overflow-y: auto;
  }

  .healthy {
    padding: var(--space-md) var(--space-xl);
    background: var(--success-bg);
    color: var(--success);
    border-bottom: 1px solid var(--success-line);
    font-weight: var(--weight-semibold);
    font-size: var(--font-size-base);
  }

  .owner {
    position: sticky;
    top: 0;
    z-index: 1;
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    padding: var(--space-md) var(--space-xl) var(--space-xs);
    background: var(--surface);
    border-bottom: 1px solid var(--border);
  }
  .owner-name {
    font: var(--weight-bold) var(--font-size-2xs) / var(--leading-none) var(--font-mono);
    letter-spacing: 0.07em;
    color: var(--text-2);
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
  .empty h2 {
    margin: 0 0 var(--space-xs);
    font-size: var(--font-size-lg);
  }
  .empty p {
    margin: 0 auto var(--space-2xl);
    max-width: 240px;
    font-size: var(--font-size-base);
    line-height: var(--leading-relaxed);
    color: var(--text-2);
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

  .footer {
    display: flex;
    align-items: center;
    padding: var(--space-sm) var(--space-xl);
    border-top: 1px solid var(--border);
    background: var(--surface);
    font: var(--weight-medium) var(--font-size-xs) / var(--leading-none) var(--font-mono);
    color: var(--text-3);
  }
  .live {
    display: inline-flex;
    align-items: center;
    gap: var(--space-xs);
  }
  .ring {
    width: 9px;
    height: 9px;
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
</style>
