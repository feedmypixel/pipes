<script lang="ts">
  import RefreshCw from '@lucide/svelte/icons/refresh-cw'
  import PanelRight from '@lucide/svelte/icons/panel-right'
  import Settings from '@lucide/svelte/icons/settings'
  import ChevronDown from '@lucide/svelte/icons/chevron-down'
  import * as storage from '../lib/storage'
  import type { Snapshots } from '../lib/storage'
  import { groupByOwner, countDefaultBranchFailures } from '../lib/group'
  import type { Account, Repo } from '../providers/types'
  import Row from '../lib/components/Row.svelte'

  let accounts = $state<Account[]>([])
  let watchedRepos = $state<Repo[]>([])
  let snapshots = $state<Snapshots>({})
  let expanded = $state<Record<string, boolean>>({})

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
      <button class="icon-btn" title="Refresh now" aria-label="Refresh now" onclick={refresh}>
        <RefreshCw size={17} />
      </button>
      <button
        class="icon-btn"
        title="Open side panel"
        aria-label="Open side panel"
        onclick={openSidePanel}
      >
        <PanelRight size={17} />
      </button>
      <button class="icon-btn" title="Options" aria-label="Options" onclick={openOptions}>
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
      <button class="cta" onclick={openOptions}>Open setup</button>
    </div>
  {:else if watchedRepos.length === 0}
    <div class="empty">
      <h2>No repositories watched</h2>
      <p>Choose the repos to watch in the options.</p>
      <button class="cta" onclick={openOptions}>Choose repos</button>
    </div>
  {:else}
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
            {#each view.active as branch (branch.id)}
              <Row name={view.displayName} pipeline={branch} child />
            {/each}
            {#if view.collapsed.length > 0}
              <button
                class="more"
                aria-expanded={expanded[view.repo.id] ?? false}
                onclick={() => (expanded[view.repo.id] = !expanded[view.repo.id])}
              >
                <ChevronDown size={11} />
                {expanded[view.repo.id] ? 'Hide' : 'Show'}
                {view.collapsed.length} more branch{view.collapsed.length > 1 ? 'es' : ''}
              </button>
              {#if expanded[view.repo.id]}
                {#each view.collapsed as branch (branch.id)}
                  <Row name={view.displayName} pipeline={branch} child />
                {/each}
              {/if}
            {/if}
          {/each}
        </section>
      {/each}
    </main>
  {/if}

  <footer class="foot">
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
    gap: 9px;
    padding: 10px 12px;
    background: var(--appbar);
    border-bottom: 2px solid var(--brand);
  }
  .logo {
    display: block;
    border-radius: 4px;
  }
  .wordmark {
    font-weight: 700;
    font-size: 15px;
    letter-spacing: -0.01em;
    color: var(--appbar-text);
  }
  .actions {
    margin-left: auto;
    display: flex;
    gap: 2px;
  }
  .icon-btn {
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
  .icon-btn:hover {
    background: var(--appbar-hover);
    color: var(--appbar-text);
  }

  .alarm {
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 9px 14px;
    background: var(--alarm-strip);
    color: var(--alarm-ink);
    border-bottom: 1px solid var(--alarm-line);
    font-weight: 600;
    font-size: 12.5px;
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

  .body {
    max-height: 520px;
    overflow-y: auto;
  }

  .healthy {
    padding: 9px 14px;
    background: var(--success-bg);
    color: var(--success);
    border-bottom: 1px solid var(--success-line);
    font-weight: 600;
    font-size: 12.5px;
  }

  .owner {
    position: sticky;
    top: 0;
    z-index: 1;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 9px 14px 6px;
    background: var(--surface);
    border-bottom: 1px solid var(--border);
  }
  .owner-name {
    font: 650 10.5px/1 var(--font-mono);
    letter-spacing: 0.07em;
    color: var(--text-2);
  }
  .count {
    margin-left: auto;
    font: 600 10px/1 var(--font-mono);
    color: var(--text-3);
    border: 1px solid var(--border);
    border-radius: var(--radius-pill);
    padding: 2px 7px;
  }

  .more {
    display: flex;
    align-items: center;
    gap: 6px;
    width: 100%;
    padding: 6px 14px 6px 46px;
    border: 0;
    border-bottom: 1px solid var(--border);
    background: var(--bg);
    color: var(--text-3);
    font: 500 11px/1 var(--font-sans);
    text-align: left;
    cursor: pointer;
  }
  .more:hover {
    background: var(--hover);
    color: var(--text);
  }

  .empty {
    padding: 40px 28px;
    text-align: center;
  }
  .empty h2 {
    margin: 0 0 6px;
    font-size: 15px;
  }
  .empty p {
    margin: 0 auto 16px;
    max-width: 240px;
    font-size: 12.5px;
    line-height: 1.5;
    color: var(--text-2);
  }
  .cta {
    padding: 9px 15px;
    border: 0;
    border-radius: var(--radius);
    background: var(--brand);
    color: var(--brand-ink);
    font: 600 12.5px/1 var(--font-sans);
    cursor: pointer;
  }

  .foot {
    display: flex;
    align-items: center;
    padding: 8px 14px;
    border-top: 1px solid var(--border);
    background: var(--surface);
    font: 500 11px/1 var(--font-mono);
    color: var(--text-3);
  }
  .live {
    display: inline-flex;
    align-items: center;
    gap: 6px;
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
