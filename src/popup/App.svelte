<script lang="ts">
  import RefreshCw from '@lucide/svelte/icons/refresh-cw'
  import PanelRight from '@lucide/svelte/icons/panel-right'
  import Settings from '@lucide/svelte/icons/settings'
  import { groupByOwner, filterGroups, ALL_BRANCH_STATES } from '../lib/group'
  import RepoList from '../lib/components/RepoList.svelte'
  import TopAlerts from '../lib/components/TopAlerts.svelte'
  import UpdatedFooter from '../lib/components/UpdatedFooter.svelte'
  import { useDashboard } from '../lib/dashboard.svelte'
  import browser from '../lib/browser'
  import { openDashboard } from '../lib/platform'

  const dash = useDashboard()

  const groups = $derived(
    filterGroups(groupByOwner(dash.watchedRepos, dash.snapshots, dash.accounts), ALL_BRANCH_STATES)
  )

  async function showDashboard() {
    await openDashboard()
    window.close()
  }

  function openOptions() {
    browser.runtime.openOptionsPage()
  }
</script>

<div class="popup">
  <header class="appbar">
    <img class="logo" src="/icons/icon-32.png" alt="" width="24" height="24" />
    <span class="wordmark">Pipes</span>
    <div class="actions">
      {#if dash.configured}
        <button
          class="icon-button"
          class:spinning={dash.refreshing}
          title="Refresh now"
          aria-label="Refresh now"
          onclick={dash.refresh}
        >
          <RefreshCw size={17} />
        </button>
      {/if}
      <button
        class="icon-button"
        title="Open dashboard"
        aria-label="Open dashboard"
        onclick={showDashboard}
      >
        <PanelRight size={17} />
      </button>
      <button class="icon-button" title="Settings" aria-label="Settings" onclick={openOptions}>
        <Settings size={17} />
      </button>
    </div>
  </header>

  <TopAlerts
    connectionIssues={dash.connectionIssues}
    rateLimited={dash.rateLimited}
    mainFailing={dash.mainFailing}
    ready={dash.configured && dash.watchedRepos.length > 0}
    onOpenSettings={openOptions}
  />

  {#if !dash.configured}
    <div class="empty">
      <h2>No connections yet</h2>
      <p>Add a GitHub or GitLab account to start watching pipelines</p>
      <button class="empty-action" onclick={openOptions}>Settings</button>
    </div>
  {:else if dash.watchedRepos.length === 0}
    <div class="empty">
      <h2>No repositories watched</h2>
      <p>Choose the repos to watch in the options.</p>
      <button class="empty-action" onclick={openOptions}>Choose repos</button>
    </div>
  {:else}
    <main class="body">
      <RepoList {groups} allowed={ALL_BRANCH_STATES} storageKey="pipes-popup" defaultCollapsed />
    </main>
  {/if}

  <UpdatedFooter lastPolledAt={dash.lastPolledAt} configured={dash.configured} />
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

  .body {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
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
