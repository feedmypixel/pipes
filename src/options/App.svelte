<script lang="ts">
  import Plug from '@lucide/svelte/icons/plug'
  import Trash2 from '@lucide/svelte/icons/trash-2'
  import Check from '@lucide/svelte/icons/check'
  import Search from '@lucide/svelte/icons/search'
  import X from '@lucide/svelte/icons/x'
  import RefreshCw from '@lucide/svelte/icons/refresh-cw'
  import BadgeCheck from '@lucide/svelte/icons/badge-check'
  import GitBranch from '@lucide/svelte/icons/git-branch'
  import * as storage from '../lib/storage'
  import type { Settings } from '../lib/storage'
  import { getProvider, normaliseHost, saasProvider } from '../providers'
  import type { Account, ProviderId, Repo } from '../providers/types'
  import { MIN_POLL_MINUTES, SAAS_HOST } from '../lib/config'
  import { groupReposByOwner } from '../lib/group'
  import Field from '../lib/components/forms/Field.svelte'
  import Input from '../lib/components/forms/Input.svelte'
  import Select from '../lib/components/forms/Select.svelte'
  import PasswordInput from '../lib/components/forms/PasswordInput.svelte'
  import FormSummary from '../lib/components/forms/FormSummary.svelte'
  import ChevronRight from '@lucide/svelte/icons/chevron-right'
  import Banner from '../lib/components/Banner.svelte'
  import Button from '../lib/components/Button.svelte'
  import PermissionNote from '../lib/components/PermissionNote.svelte'
  import ToastHost from '../lib/components/ToastHost.svelte'
  import { toastSuccess, toastInfo, toastUndo } from '../lib/toasts.svelte'

  let accounts = $state<Account[]>([])
  let watchedRepos = $state<Repo[]>([])
  let settings = $state<Settings>({ pollMinutes: 1, notifyOnSuccess: true })

  type HostChoice = 'github' | 'gitlab' | 'self'
  let label = $state('')
  let hostChoice = $state<HostChoice>('github')
  let host = $state<string>(SAAS_HOST.github)
  let token = $state('')
  let errors = $state<{ host?: string; token?: string }>({})
  let availability = $state<{ state: 'busy' | 'ok' | 'bad'; text: string } | null>(null)
  let detected = $state<ProviderId | null>(null)
  let submitting = $state(false)
  let addResult = $state<{ variant: 'ok' | 'err'; text: string } | null>(null)

  let reposByAccount = $state<Record<string, Repo[]>>({})
  let loadingRepos = $state<Record<string, boolean>>({})
  let failedRepos = $state<Record<string, boolean>>({})
  let search = $state('')

  $effect(() => {
    storage.get('accounts').then((value) => {
      accounts = value
      // Render cached repos immediately, then refresh each connection in the background.
      value.forEach((account) => loadRepos(account))
    })
    storage.get('watchedRepos').then((value) => (watchedRepos = value))
    storage.get('availableRepos').then((value) => (reposByAccount = value))
    storage.get('settings').then((value) => (settings = value))
  })

  // Success banners are confirmations, not state — let them fade after a few seconds.
  $effect(() => {
    if (addResult?.variant === 'ok') {
      const id = setTimeout(() => (addResult = null), 5000)
      return () => clearTimeout(id)
    }
  })

  const watchedIds = $derived(new Set(watchedRepos.map((r) => r.id)))
  const summaryErrors = $derived(
    [
      errors.host ? { name: 'host', message: errors.host } : null,
      errors.token ? { name: 'token', message: errors.token } : null
    ].filter((e): e is { name: string; message: string } => e !== null)
  )

  // The select picks the SaaS origin for us; only self-hosted needs the URL field.
  function syncHost() {
    host = hostChoice === 'self' ? '' : SAAS_HOST[hostChoice]
    errors.host = undefined
    availability = null
    detected = null
  }
  function checkHost() {
    errors.host = host.trim() ? undefined : 'Enter a host'
  }
  function checkToken() {
    errors.token = token.trim() ? undefined : 'Enter a token'
  }
  function clearHostIfValid() {
    if (errors.host && host.trim()) {
      errors.host = undefined
    }
  }
  function clearTokenIfValid() {
    if (errors.token && token.trim()) {
      errors.token = undefined
    }
  }

  function tempAccount(provider: ProviderId): Account {
    return { id: 'probe', provider, label, host: normaliseHost(host), token }
  }

  async function ensurePermission(origin: string): Promise<boolean> {
    if (saasProvider(origin)) {
      return true
    }
    return chrome.permissions.request({ origins: [`${origin}/*`] })
  }

  async function validate(): Promise<boolean> {
    const origin = normaliseHost(host)
    if (!origin) {
      errors.host = 'Enter a valid host'
      document.getElementById('host')?.focus()
      return false
    }
    if (!token) {
      errors.token = 'Enter a token'
      document.getElementById('token')?.focus()
      return false
    }
    availability = { state: 'busy', text: 'Validating…' }
    detected = null
    if (!(await ensurePermission(origin))) {
      availability = { state: 'bad', text: 'Permission for this host was declined' }
      return false
    }
    const saas = saasProvider(origin)
    const candidates: ProviderId[] = saas ? [saas] : ['github', 'gitlab']
    for (const id of candidates) {
      const result = await getProvider(id).validateToken(tempAccount(id))
      if (result.ok) {
        detected = id
        const name = id === 'github' ? 'GitHub' : 'GitLab'
        availability = { state: 'ok', text: `Signed in as ${result.user}` }
        addResult = {
          variant: 'ok',
          text: `Signed in as ${result.user} on ${name}, add the connection below`
        }
        return true
      }
    }
    availability = { state: 'bad', text: 'Could not validate, check the token and host' }
    return false
  }

  async function addConnection() {
    checkHost()
    checkToken()
    if (errors.host || errors.token) {
      document.getElementById(errors.host ? 'host' : 'token')?.focus()
      return
    }
    submitting = true
    addResult = null
    const ok = await validate()
    if (!ok || detected === null) {
      submitting = false
      addResult = { variant: 'err', text: availability?.text ?? 'Could not validate' }
      return
    }
    const origin = normaliseHost(host)
    const account: Account = {
      id: crypto.randomUUID(),
      provider: detected,
      label: label.trim() || origin.replace(/^https?:\/\//, ''),
      host: origin,
      token
    }
    accounts = [...accounts, account]
    await storage.set('accounts', accounts)
    addResult = { variant: 'ok', text: 'Connection added' }
    toastSuccess('Connection added')
    label = ''
    hostChoice = 'github'
    host = SAAS_HOST.github
    token = ''
    availability = null
    detected = null
    submitting = false
    loadRepos(account)
  }

  async function removeAccount(account: Account) {
    const removedRepos = watchedRepos.filter((r) => r.accountId === account.id)
    const cachedRepos = reposByAccount[account.id]
    accounts = accounts.filter((a) => a.id !== account.id)
    watchedRepos = watchedRepos.filter((r) => r.accountId !== account.id)
    const remainingRepos = { ...reposByAccount }
    delete remainingRepos[account.id]
    reposByAccount = remainingRepos
    await storage.set('accounts', accounts)
    await storage.set('watchedRepos', watchedRepos)
    await storage.set('availableRepos', reposByAccount)
    toastUndo('Connection removed', async () => {
      accounts = [...accounts, account]
      watchedRepos = [...watchedRepos, ...removedRepos]
      reposByAccount = { ...reposByAccount, [account.id]: cachedRepos ?? [] }
      await storage.set('accounts', accounts)
      await storage.set('watchedRepos', watchedRepos)
      await storage.set('availableRepos', reposByAccount)
    })
  }

  async function loadRepos(account: Account) {
    loadingRepos[account.id] = true
    failedRepos[account.id] = false
    try {
      const repos = await getProvider(account.provider).listRepos(account)
      reposByAccount[account.id] = repos
      await storage.set('availableRepos', { ...reposByAccount, [account.id]: repos })
    } catch {
      // Keep any cached repos on screen; just flag the failure for a retry.
      failedRepos[account.id] = true
    } finally {
      loadingRepos[account.id] = false
    }
  }

  async function toggleRepo(repo: Repo) {
    const watching = watchedIds.has(repo.id)
    watchedRepos = watching ? watchedRepos.filter((r) => r.id !== repo.id) : [...watchedRepos, repo]
    await storage.set('watchedRepos', watchedRepos)
    const shortName = repo.name.split('/').pop() ?? repo.name
    if (watching) {
      toastInfo(`No longer watching ${shortName}`)
    } else {
      toastSuccess(`Watching ${shortName}`)
    }
  }

  function matches(repo: Repo): boolean {
    return repo.name.toLowerCase().includes(search.trim().toLowerCase())
  }

  function allWatched(repos: Repo[]): boolean {
    return repos.length > 0 && repos.every((repo) => watchedIds.has(repo.id))
  }

  async function toggleWatchAll(repos: Repo[]) {
    const turnOn = !allWatched(repos)
    const ids = new Set(repos.map((repo) => repo.id))
    watchedRepos = turnOn
      ? [...watchedRepos, ...repos.filter((repo) => !watchedIds.has(repo.id))]
      : watchedRepos.filter((repo) => !ids.has(repo.id))
    await storage.set('watchedRepos', watchedRepos)
    toastSuccess(turnOn ? `Watching ${repos.length} repos` : `Unwatched ${repos.length} repos`)
  }

  async function clearAllWatched() {
    if (watchedRepos.length === 0) {
      return
    }
    const previous = watchedRepos
    watchedRepos = []
    await storage.set('watchedRepos', [])
    toastUndo('Cleared all watched repositories', async () => {
      watchedRepos = previous
      await storage.set('watchedRepos', previous)
    })
  }

  async function setPoll(next: number) {
    settings = { ...settings, pollMinutes: Math.max(MIN_POLL_MINUTES, Math.round(next * 2) / 2) }
    await storage.set('settings', settings)
    toastSuccess('Settings saved')
  }

  async function toggleNotify() {
    settings = { ...settings, notifyOnSuccess: !settings.notifyOnSuccess }
    await storage.set('settings', settings)
    toastSuccess('Settings saved')
  }
</script>

<div class="options">
  <div class="inner">
    <header class="masthead">
      <img src="/icons/icon-48.png" alt="" width="34" height="34" />
      <div>
        <h1>Pipes settings</h1>
        <p class="tag">Connections, repositories, and preferences.</p>
      </div>
    </header>

    <section class="card">
      <h2><Plug size={16} /> Connections</h2>
      {#if accounts.length > 0}
        <ul class="connection-list">
          {#each accounts as account (account.id)}
            <li class="connection">
              <span class="dot ok" aria-hidden="true"></span>
              <span class="connection-main">
                <span class="connection-label">{account.label}</span>
                <span class="connection-host">{account.host}</span>
              </span>
              <span class="token-state ok"><Check size={14} /> token saved</span>
              <button
                class="icon-button"
                title="Remove"
                aria-label="Remove connection"
                onclick={() => removeAccount(account)}
              >
                <Trash2 size={15} />
              </button>
            </li>
          {/each}
        </ul>
      {/if}

      <div class="card-body">
        <h3>Add a connection</h3>
        {#if addResult}
          <Banner variant={addResult.variant}>{addResult.text}</Banner>
        {/if}
        <FormSummary errors={summaryErrors} />
        <Field name="label" label="Label" optional>
          <Input placeholder="work" autocomplete="off" bind:value={label} />
        </Field>
        <Field name="provider" label="Provider">
          <Select bind:value={hostChoice} onchange={syncHost}>
            <option value="github">GitHub (github.com)</option>
            <option value="gitlab">GitLab (gitlab.com)</option>
            <option value="self">Self-hosted…</option>
          </Select>
        </Field>
        {#if hostChoice === 'self'}
          <Field
            name="host"
            label="Host URL"
            hint="your GitHub Enterprise or GitLab origin, e.g. gitlab.example.com"
            error={errors.host}
          >
            <Input
              placeholder="gitlab.example.com"
              autocomplete="off"
              bind:value={host}
              onblur={checkHost}
              oninput={clearHostIfValid}
            />
          </Field>
        {/if}
        {#snippet tokenHint()}
          <details class="token-help">
            <summary>
              <ChevronRight class="chevron" size={14} />
              <span>What permissions does my token need?</span>
            </summary>
            <ul>
              <li><b>GitHub</b>: fine-grained — <b>Actions: read</b> + <b>Contents: read</b>.</li>
              <li><b>GitLab</b>: PAT with <b>read_api</b>.</li>
            </ul>
          </details>
        {/snippet}
        <Field
          name="token"
          label="Personal access token"
          hint={tokenHint}
          error={errors.token}
          mono
          below={availability ?? undefined}
        >
          <PasswordInput
            autocomplete="off"
            bind:value={token}
            onblur={checkToken}
            oninput={clearTokenIfValid}
          />
        </Field>
        <div class="note-row"><PermissionNote /></div>
        <div class="button-group">
          <Button variant="primary" {submitting} onclick={addConnection}>
            <Plug size={14} />
            {submitting ? 'Adding connection…' : 'Add connection'}
          </Button>
          <Button variant="secondary" disabled={submitting} onclick={validate}>
            <BadgeCheck size={14} /> Validate
          </Button>
        </div>
      </div>
    </section>

    {#if accounts.length > 0}
      <section class="card">
        <h2><Search size={16} /> Watched repositories</h2>
        <div class="card-body">
          <div class="repo-search">
            <Search size={15} />
            <input type="text" placeholder="Filter repositories…" bind:value={search} />
            {#if search}
              <button class="repo-clear" aria-label="Clear search" onclick={() => (search = '')}>
                <X size={15} />
              </button>
            {/if}
          </div>
          {#if watchedRepos.length > 0}
            <div class="repo-toolbar">
              <span>{watchedRepos.length} watched</span>
              <button class="watch-all" onclick={clearAllWatched}>Clear all selections</button>
            </div>
          {/if}
          {#each accounts as account (account.id)}
            {@const repos = reposByAccount[account.id]}
            {@const host = account.host.replace(/^https?:\/\//, '')}
            {#if repos === undefined && loadingRepos[account.id]}
              <p class="repo-empty">Loading {host}…</p>
            {:else if repos === undefined && failedRepos[account.id]}
              <div class="repo-error">
                <span>Couldn't reach {host}</span>
                <Button variant="secondary" onclick={() => loadRepos(account)}>Retry</Button>
              </div>
            {:else if repos !== undefined}
              {@const groups = groupReposByOwner(repos.filter(matches))}
              {#if repos.length === 0}
                <p class="repo-empty">No repositories found for {host}</p>
              {:else if groups.length === 0}
                <p class="repo-empty">No repositories match “{search}”</p>
              {:else}
                {#each groups as group (host + '/' + group.owner)}
                  <div class="repo-group">
                    <div class="repo-group-header">
                      <span>{host} / {group.owner}</span>
                      <button class="watch-all" onclick={() => toggleWatchAll(group.repos)}>
                        {allWatched(group.repos) ? 'Unwatch all' : 'Watch all'}
                      </button>
                      <button
                        class="icon-button refresh"
                        class:spinning={loadingRepos[account.id]}
                        title="Refresh"
                        aria-label="Refresh repositories for {group.owner}"
                        onclick={() => loadRepos(account)}
                      >
                        <RefreshCw size={13} />
                      </button>
                    </div>
                    {#each group.repos as repo (repo.id)}
                      <button
                        class="repo-item"
                        class:on={watchedIds.has(repo.id)}
                        onclick={() => toggleRepo(repo)}
                      >
                        <span class="checkbox">
                          {#if watchedIds.has(repo.id)}<Check size={11} />{/if}
                        </span>
                        <span class="repo-name">{repo.name}</span>
                        <span class="repo-branch"><GitBranch size={13} /> {repo.defaultBranch}</span
                        >
                      </button>
                    {/each}
                  </div>
                {/each}
              {/if}
            {/if}
          {/each}
        </div>
      </section>
    {/if}

    <section class="card">
      <h2>Settings</h2>
      <div class="card-body">
        <div class="set-row">
          <span class="setting-item">
            <span class="title">Poll interval</span>
            <span class="description">How often Pipes checks (minimum {MIN_POLL_MINUTES} min).</span
            >
          </span>
          <span class="stepper">
            <button
              onclick={() => setPoll(settings.pollMinutes - MIN_POLL_MINUTES)}
              aria-label="Less often">−</button
            >
            <span class="val">{settings.pollMinutes}<small>min</small></span>
            <button
              onclick={() => setPoll(settings.pollMinutes + MIN_POLL_MINUTES)}
              aria-label="More often">+</button
            >
          </span>
        </div>
        <div class="set-row">
          <span class="setting-item">
            <span class="title">Notify when a pipeline recovers</span>
            <span class="description">A toast when a broken pipeline goes green again.</span>
          </span>
          <button
            class="toggle"
            role="switch"
            aria-checked={settings.notifyOnSuccess}
            aria-label="Notify on recovery"
            onclick={toggleNotify}
          ></button>
        </div>
      </div>
    </section>

    <p class="security">
      <Check size={18} />
      <span
        >Tokens are stored on this device via <b>chrome.storage.local</b>, used read-only, and never
        synced or logged.</span
      >
    </p>
  </div>
</div>

<ToastHost />

<style>
  .options {
    min-height: 100vh;
    background: var(--canvas);
    color: var(--text);
    font-size: var(--font-size-md);
  }
  .inner {
    /* page frame — generous one-off gutters, not scale spacing */
    max-width: 720px;
    margin: 0 auto;
    padding: 28px 24px 64px;
  }
  .masthead {
    display: flex;
    align-items: center;
    gap: var(--space-lg);
    margin-bottom: var(--space-sm);
  }
  .masthead h1 {
    margin: 0;
    font-size: var(--font-size-2xl);
  }
  .masthead .tag {
    margin: var(--space-3xs) 0 0;
    font-size: var(--font-size-base);
    color: var(--text-3);
  }
  .card {
    margin-top: var(--space-4xl);
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    box-shadow: var(--shadow);
    overflow: hidden;
  }
  .card > h2 {
    display: flex;
    align-items: center;
    gap: var(--space-md);
    margin: 0;
    padding: var(--space-2xl) var(--space-3xl);
    border-bottom: 1px solid var(--border);
    font-size: var(--font-size-base);
    font-weight: var(--weight-heavy);
  }
  .card > h2 :global(svg) {
    color: var(--text-2);
  }
  .card-body {
    padding: var(--space-2xl) var(--space-3xl);
  }
  .card-body h3 {
    margin: 0 0 var(--space-xl);
    font-size: var(--font-size-base);
  }

  .connection-list {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .connection {
    display: flex;
    align-items: center;
    gap: var(--space-lg);
    padding: var(--space-xl) var(--space-3xl);
    border-bottom: 1px solid var(--border);
  }
  .dot {
    width: 9px;
    height: 9px;
    border-radius: 50%;
    flex: none;
  }
  .dot.ok {
    background: var(--success);
  }
  .connection-main {
    min-width: 0;
  }
  .connection-label {
    display: block;
    font-weight: var(--weight-bold);
    font-size: var(--font-size-md);
  }
  .connection-host {
    font: var(--weight-medium) var(--font-size-sm) / var(--leading-snug) var(--font-mono);
    color: var(--text-3);
  }
  .token-state {
    display: inline-flex;
    align-items: center;
    gap: var(--space-xs);
    margin-left: auto;
    font-size: var(--font-size-sm);
    font-weight: var(--weight-semibold);
  }
  .token-state.ok {
    color: var(--success);
  }
  .icon-button {
    display: grid;
    place-items: center;
    width: 30px;
    height: 30px;
    border: 0;
    border-radius: var(--radius);
    background: transparent;
    color: var(--text-2);
    cursor: pointer;
  }
  .icon-button:hover {
    background: var(--hover);
    color: var(--text);
  }

  .token-help {
    margin-top: var(--space-sm);
    font-size: var(--font-size-sm);
    color: var(--text-2);
  }
  .token-help summary {
    display: flex;
    align-items: center;
    gap: var(--space-2xs);
    cursor: pointer;
    color: var(--text-3);
    font-size: var(--font-size-xs);
    list-style: none;
  }
  .token-help summary::-webkit-details-marker {
    display: none;
  }
  .token-help summary :global(.chevron) {
    flex: none;
    transition: transform 0.12s;
  }
  .token-help[open] summary :global(.chevron) {
    transform: rotate(90deg);
  }
  @media (prefers-reduced-motion: reduce) {
    .token-help summary :global(.chevron) {
      transition: none;
    }
  }
  .token-help summary span {
    text-decoration: underline;
    text-underline-offset: 2px;
  }
  .token-help ul {
    margin: var(--space-sm) 0 0;
    padding: var(--space-md) var(--space-lg) var(--space-md) var(--space-4xl);
    background: var(--surface-2);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    list-style: disc;
    line-height: var(--leading-normal);
  }
  .token-help li + li {
    margin-top: var(--space-xs);
  }
  .token-help b {
    color: var(--text);
    font-weight: var(--weight-semibold);
  }
  .note-row {
    margin-top: var(--space-lg);
  }
  .button-group {
    display: flex;
    gap: var(--space-md);
    align-items: center;
    margin-top: var(--space-2xl);
  }

  .repo-search {
    display: flex;
    align-items: center;
    gap: var(--space-md);
    /* Fixed height so the row never shifts when the clear button appears or while typing. */
    height: 2.75rem;
    box-sizing: border-box;
    padding: 0 var(--space-xl);
    border: 1px solid var(--border-2);
    border-radius: var(--radius);
    background: var(--bg);
    margin-bottom: var(--space-lg);
  }
  .repo-search :global(svg) {
    color: var(--text-3);
  }
  .repo-search input {
    flex: 1;
    border: 0;
    background: transparent;
    outline: 0;
    color: var(--text);
    font: var(--weight-medium) var(--font-size-base) / var(--leading-none) var(--font-sans);
  }
  .repo-clear {
    display: grid;
    place-items: center;
    flex: none;
    width: 22px;
    height: 22px;
    padding: 0;
    border: 0;
    border-radius: var(--radius-pill);
    background: transparent;
    color: var(--text-3);
    cursor: pointer;
  }
  .repo-clear:hover {
    background: var(--hover);
    color: var(--text);
  }
  .repo-group {
    border: 1px solid var(--border);
    border-radius: var(--radius);
    overflow: hidden;
    margin-bottom: var(--space-lg);
  }
  .repo-group-header {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    padding: var(--space-xs) var(--space-sm) var(--space-xs) var(--space-xl);
    background: var(--surface-2);
    border-bottom: 1px solid var(--border);
    font: var(--weight-semibold) var(--font-size-xs) / var(--leading-none) var(--font-mono);
    color: var(--text-2);
  }
  .repo-group-header > span {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .watch-all {
    flex: none;
    padding: 0;
    border: 0;
    background: transparent;
    color: var(--link);
    font: var(--weight-semibold) var(--font-size-xs) / var(--leading-none) var(--font-sans);
    cursor: pointer;
  }
  .watch-all:hover {
    text-decoration: underline;
    text-underline-offset: 2px;
  }
  .repo-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-sm);
    margin-bottom: var(--space-lg);
    color: var(--text-3);
    font: var(--weight-medium) var(--font-size-xs) / var(--leading-none) var(--font-sans);
  }
  .refresh {
    width: 26px;
    height: 26px;
  }
  .refresh.spinning :global(svg) {
    animation: spin 0.8s linear infinite;
  }
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .refresh.spinning :global(svg) {
      animation: none;
    }
  }
  .repo-empty {
    margin: 0;
    padding: var(--space-lg) var(--space-xl);
    font-size: var(--font-size-base);
    color: var(--text-3);
  }
  .repo-error {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-md);
    padding: var(--space-md) var(--space-xl);
    font-size: var(--font-size-base);
    color: var(--failed);
  }
  .repo-item {
    display: flex;
    align-items: center;
    gap: var(--space-lg);
    width: 100%;
    padding: var(--space-md) var(--space-xl);
    border: 0;
    border-bottom: 1px solid var(--border);
    background: transparent;
    color: inherit;
    text-align: left;
    cursor: pointer;
  }
  .repo-item:hover {
    background: var(--hover);
  }
  .checkbox {
    display: grid;
    place-items: center;
    width: 17px;
    height: 17px;
    flex: none;
    border: 1.6px solid var(--border-2);
    border-radius: var(--radius);
    background: var(--bg);
    color: transparent;
  }
  .repo-item.on .checkbox {
    background: var(--brand);
    border-color: var(--brand);
    color: var(--brand-ink);
  }
  .repo-name {
    font-weight: var(--weight-semibold);
    font-size: var(--font-size-base);
  }
  .repo-branch {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2xs);
    margin-left: auto;
    flex: none;
    padding: var(--space-2xs) var(--space-sm);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    font: var(--weight-medium) var(--font-size-xs) / var(--leading-none) var(--font-mono);
    color: var(--text-2);
  }
  .repo-branch :global(svg) {
    opacity: 0.7;
  }

  .set-row {
    display: flex;
    align-items: center;
    gap: var(--space-2xl);
    padding: var(--space-2xl) 0;
    border-bottom: 1px solid var(--border);
  }
  .set-row:last-child {
    border-bottom: 0;
  }
  .setting-item .title {
    display: block;
    font-weight: var(--weight-semibold);
    font-size: var(--font-size-md);
  }
  .setting-item .description {
    font-size: var(--font-size-sm);
    color: var(--text-3);
  }
  .stepper {
    display: inline-flex;
    margin-left: auto;
    border: 1px solid var(--border-2);
    border-radius: var(--radius);
    overflow: hidden;
  }
  .stepper button {
    width: 32px;
    height: 34px;
    border: 0;
    background: var(--bg);
    color: var(--text-2);
    font-size: var(--font-size-xl);
    cursor: pointer;
  }
  .stepper button:hover {
    background: var(--hover);
  }
  .stepper .val {
    min-width: 64px;
    text-align: center;
    font: var(--weight-semibold) var(--font-size-base) / 34px var(--font-mono);
    border-left: 1px solid var(--border);
    border-right: 1px solid var(--border);
  }
  .stepper .val small {
    font-size: var(--font-size-2xs);
    color: var(--text-3);
  }
  .toggle {
    position: relative;
    width: 42px;
    height: 24px;
    margin-left: auto;
    flex: none;
    border: 0;
    border-radius: var(--radius-pill);
    background: var(--border-2);
    cursor: pointer;
    transition: background 0.15s;
  }
  .toggle::after {
    content: '';
    position: absolute;
    top: 3px;
    left: 3px;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: white;
    transition: transform 0.15s;
  }
  .toggle[aria-checked='true'] {
    background: var(--brand);
  }
  .toggle[aria-checked='true']::after {
    transform: translateX(18px);
  }

  .security {
    display: flex;
    gap: var(--space-lg);
    align-items: flex-start;
    margin-top: var(--space-4xl);
    padding: var(--space-xl) var(--space-2xl);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    background: var(--surface);
    font-size: var(--font-size-base);
    line-height: var(--leading-relaxed);
    color: var(--text-2);
  }
  .security :global(svg) {
    flex: none;
    color: var(--success);
    margin-top: 1px;
  }
  .security b {
    color: var(--text);
  }
</style>
