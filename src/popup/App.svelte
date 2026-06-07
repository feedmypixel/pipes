<script lang="ts">
  import RefreshCw from '@lucide/svelte/icons/refresh-cw'
  import PanelRight from '@lucide/svelte/icons/panel-right'
  import Settings from '@lucide/svelte/icons/settings'
  import * as storage from '../lib/storage'
  import type { Snapshots, AccountHealth } from '../lib/storage'
  import {
    groupByOwner,
    filterGroups,
    failingCount,
    ALL_BRANCH_STATES,
    countDefaultBranchFailures
  } from '../lib/group'
  import type { Account, Repo } from '../providers/types'
  import RepoList from '../lib/components/RepoList.svelte'
  import TopAlerts from '../lib/components/TopAlerts.svelte'
  import UpdatedFooter from '../lib/components/UpdatedFooter.svelte'

  let accounts = $state<Account[]>([])
  let watchedRepos = $state<Repo[]>([])
  let snapshots = $state<Snapshots>({})
  let accountHealth = $state<Record<string, AccountHealth>>({})
  let lastPolledAt = $state(0)
  let refreshing = $state(false)
  let failuresOnly = $state(localStorage.getItem('pipes-popup-failures-only') === 'true')

  $effect(() => localStorage.setItem('pipes-popup-failures-only', String(failuresOnly)))

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

  const allGroups = $derived(filterGroups(groupByOwner(watchedRepos, snapshots), ALL_BRANCH_STATES))
  const groups = $derived(
    failuresOnly
      ? allGroups
          .map((group) => ({
            owner: group.owner,
            repos: group.repos.filter((view) => failingCount(view) > 0)
          }))
          .filter((group) => group.repos.length > 0)
      : allGroups
  )
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

  async function refresh() {
    refreshing = true
    try {
      await chrome.runtime.sendMessage({ type: 'poll-now' })
    } finally {
      refreshing = false
    }
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
      {#if configured}
        <button
          class="icon-button"
          class:spinning={refreshing}
          title="Refresh now"
          aria-label="Refresh now"
          onclick={refresh}
        >
          <RefreshCw size={17} />
        </button>
      {/if}
      <button
        class="icon-button"
        title="Open side panel"
        aria-label="Open side panel"
        onclick={openSidePanel}
      >
        <PanelRight size={17} />
      </button>
      <button class="icon-button" title="Settings" aria-label="Settings" onclick={openOptions}>
        <Settings size={17} />
      </button>
    </div>
  </header>

  <TopAlerts
    {connectionIssues}
    {mainFailing}
    ready={configured && watchedRepos.length > 0}
    onOpenSettings={openOptions}
  />

  {#if !configured}
    <div class="empty">
      <h2>No connections yet</h2>
      <p>Add a GitHub or GitLab account to start watching pipelines</p>
      <button class="empty-action" onclick={openOptions}>Settings</button>
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
        class="failures"
        class:on={failuresOnly}
        aria-pressed={failuresOnly}
        title="Show only repos with a failure"
        onclick={() => (failuresOnly = !failuresOnly)}
      >
        <span class="dot"></span> Failures only
      </button>
    </div>
    <main class="body">
      {#if groups.length === 0}
        <p class="body-empty">
          {failuresOnly ? 'No failures' : 'Nothing to show'}
        </p>
      {:else}
        <RepoList {groups} allowed={ALL_BRANCH_STATES} storageKey="pipes-popup" defaultCollapsed />
      {/if}
    </main>
  {/if}

  <UpdatedFooter {lastPolledAt} {configured} />
</div>

<style>
  .popup {
    width: 440px;
    /* Cap at Chrome's max popup height so only .body scrolls (no double scrollbar). */
    max-height: 600px;
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
    border-bottom: 1px solid var(--border);
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

  .filter-bar {
    display: flex;
    padding: var(--space-sm) var(--space-lg);
    border-bottom: 1px solid var(--border);
  }
  .failures {
    display: inline-flex;
    align-items: center;
    gap: var(--space-xs);
    padding: var(--space-3xs) var(--space-md);
    border: 1px solid var(--border-2);
    border-radius: var(--radius);
    background: var(--surface);
    color: var(--text-2);
    font: var(--weight-medium) var(--font-size-sm) / var(--leading-none) var(--font-sans);
    cursor: pointer;
  }
  .failures:hover {
    background: var(--hover);
  }
  .failures .dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--failed);
  }
  .failures.on {
    background: var(--failed-bg);
    border-color: var(--failed-line);
    color: var(--failed);
  }

  .body {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
  }
  .body-empty {
    margin: 0;
    padding: var(--space-4xl) var(--space-xl);
    text-align: center;
    color: var(--text-3);
    font-size: var(--font-size-base);
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
</style>
