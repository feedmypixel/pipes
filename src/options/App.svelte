<script lang="ts">
  import Plug from '@lucide/svelte/icons/plug'
  import Plus from '@lucide/svelte/icons/plus'
  import Trash2 from '@lucide/svelte/icons/trash-2'
  import Check from '@lucide/svelte/icons/check'
  import Lock from '@lucide/svelte/icons/lock'
  import Search from '@lucide/svelte/icons/search'
  import Zap from '@lucide/svelte/icons/zap'
  import GitBranch from '@lucide/svelte/icons/git-branch'
  import * as storage from '../lib/storage'
  import type { Settings } from '../lib/storage'
  import { getProvider, normaliseHost, saasProvider } from '../providers'
  import type { Account, ProviderId, Repo } from '../providers/types'
  import Field from '../lib/components/forms/Field.svelte'
  import Input from '../lib/components/forms/Input.svelte'
  import PasswordInput from '../lib/components/forms/PasswordInput.svelte'
  import FormSummary from '../lib/components/forms/FormSummary.svelte'
  import Banner from '../lib/components/Banner.svelte'
  import ToastHost from '../lib/components/ToastHost.svelte'
  import { toastSuccess, toastUndo } from '../lib/toasts.svelte'

  let accounts = $state<Account[]>([])
  let watchedRepos = $state<Repo[]>([])
  let settings = $state<Settings>({ pollMinutes: 1, notifyOnSuccess: true })

  let label = $state('')
  let host = $state('')
  let token = $state('')
  let errors = $state<{ host?: string; token?: string }>({})
  let availability = $state<{ state: 'busy' | 'ok' | 'bad'; text: string } | null>(null)
  let detected = $state<ProviderId | null>(null)
  let submitting = $state(false)
  let addResult = $state<{ variant: 'ok' | 'err'; text: string } | null>(null)

  let reposByAccount = $state<Record<string, Repo[]>>({})
  let loadingRepos = $state<Record<string, boolean>>({})
  let search = $state('')

  $effect(() => {
    storage.get('accounts').then((value) => (accounts = value))
    storage.get('watchedRepos').then((value) => (watchedRepos = value))
    storage.get('settings').then((value) => (settings = value))
  })

  const watchedIds = $derived(new Set(watchedRepos.map((r) => r.id)))
  const summaryErrors = $derived(
    [
      errors.host ? { name: 'host', message: errors.host } : null,
      errors.token ? { name: 'token', message: errors.token } : null
    ].filter((e): e is { name: string; message: string } => e !== null)
  )

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
      availability = { state: 'bad', text: 'Enter a valid host' }
      return false
    }
    if (!token) {
      availability = { state: 'bad', text: 'Enter a token' }
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
        availability = { state: 'ok', text: `${name} detected, signed in as ${result.user}` }
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
    label = ''
    host = ''
    token = ''
    availability = null
    detected = null
    submitting = false
    loadRepos(account)
  }

  async function removeAccount(account: Account) {
    const removedRepos = watchedRepos.filter((r) => r.accountId === account.id)
    accounts = accounts.filter((a) => a.id !== account.id)
    watchedRepos = watchedRepos.filter((r) => r.accountId !== account.id)
    await storage.set('accounts', accounts)
    await storage.set('watchedRepos', watchedRepos)
    toastUndo('Connection removed', async () => {
      accounts = [...accounts, account]
      watchedRepos = [...watchedRepos, ...removedRepos]
      await storage.set('accounts', accounts)
      await storage.set('watchedRepos', watchedRepos)
    })
  }

  async function loadRepos(account: Account) {
    loadingRepos[account.id] = true
    try {
      reposByAccount[account.id] = await getProvider(account.provider).listRepos(account)
    } catch {
      reposByAccount[account.id] = []
    } finally {
      loadingRepos[account.id] = false
    }
  }

  async function toggleRepo(repo: Repo) {
    watchedRepos = watchedIds.has(repo.id)
      ? watchedRepos.filter((r) => r.id !== repo.id)
      : [...watchedRepos, repo]
    await storage.set('watchedRepos', watchedRepos)
  }

  function matches(repo: Repo): boolean {
    return repo.name.toLowerCase().includes(search.trim().toLowerCase())
  }

  async function setPoll(next: number) {
    settings = { ...settings, pollMinutes: Math.max(0.5, Math.round(next * 2) / 2) }
    await storage.set('settings', settings)
    toastSuccess('Settings saved')
  }

  async function toggleNotify() {
    settings = { ...settings, notifyOnSuccess: !settings.notifyOnSuccess }
    await storage.set('settings', settings)
    toastSuccess('Settings saved')
  }
</script>

<div class="opt">
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
        <ul class="conn-list">
          {#each accounts as account (account.id)}
            <li class="conn">
              <span class="dot ok" aria-hidden="true"></span>
              <span class="conn-main">
                <span class="conn-label">{account.label}</span>
                <span class="conn-host">{account.host}</span>
              </span>
              <span class="token-state ok"><Check size={14} /> token saved</span>
              <button
                class="icon-btn"
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

      <div class="pad">
        <h3>Add a connection</h3>
        {#if addResult}
          <Banner variant={addResult.variant}>{addResult.text}</Banner>
        {/if}
        <FormSummary errors={summaryErrors} />
        <Field name="label" label="Label" optional>
          <Input placeholder="work" autocomplete="off" bind:value={label} />
        </Field>
        <Field
          name="host"
          label="Host"
          hint="github.com, gitlab.com, or a self-hosted origin"
          error={errors.host}
        >
          <Input
            placeholder="github.com"
            autocomplete="off"
            bind:value={host}
            onblur={checkHost}
            oninput={clearHostIfValid}
          />
        </Field>
        <Field
          name="token"
          label="Personal access token"
          hint="read-only scope; never synced, never logged"
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
        <p class="permnote">
          <Lock size={15} /> Self-hosted hosts request permission when you validate. Tokens stay on this
          device.
        </p>
        <div class="button-group">
          <button
            class="btn btn-primary"
            class:submitting
            disabled={submitting}
            onclick={addConnection}
          >
            {#if !submitting}<Plus size={14} />{/if}
            {submitting ? 'Adding connection…' : 'Add connection'}
          </button>
          <button class="btn btn-secondary" disabled={submitting} onclick={validate}>
            <Zap size={14} /> Validate
          </button>
        </div>
      </div>
    </section>

    {#if accounts.length > 0}
      <section class="card">
        <h2><Search size={16} /> Watched repositories</h2>
        <div class="pad">
          <div class="repo-search">
            <Search size={15} />
            <input type="text" placeholder="Filter repositories…" bind:value={search} />
          </div>
          {#each accounts as account (account.id)}
            <div class="repo-group">
              <div class="repo-grouphdr">{account.label}</div>
              {#if loadingRepos[account.id]}
                <p class="repo-empty">Loading…</p>
              {:else if reposByAccount[account.id] === undefined}
                <button class="btn btn-secondary small" onclick={() => loadRepos(account)}>
                  Load repositories
                </button>
              {:else}
                {#each (reposByAccount[account.id] ?? []).filter(matches) as repo (repo.id)}
                  <button
                    class="repo-item"
                    class:on={watchedIds.has(repo.id)}
                    onclick={() => toggleRepo(repo)}
                  >
                    <span class="checkbox">
                      {#if watchedIds.has(repo.id)}<Check size={11} />{/if}
                    </span>
                    <span class="rn">{repo.name}</span>
                    <span class="rb"><GitBranch size={13} /> {repo.defaultBranch}</span>
                  </button>
                {/each}
              {/if}
            </div>
          {/each}
        </div>
      </section>
    {/if}

    <section class="card">
      <h2>Settings</h2>
      <div class="pad">
        <div class="set-row">
          <span class="si">
            <span class="t">Poll interval</span>
            <span class="d">How often Pipes checks (minimum 0.5 min).</span>
          </span>
          <span class="stepper">
            <button onclick={() => setPoll(settings.pollMinutes - 0.5)} aria-label="Less often"
              >−</button
            >
            <span class="val">{settings.pollMinutes}<small>min</small></span>
            <button onclick={() => setPoll(settings.pollMinutes + 0.5)} aria-label="More often"
              >+</button
            >
          </span>
        </div>
        <div class="set-row">
          <span class="si">
            <span class="t">Notify when a pipeline recovers</span>
            <span class="d">A toast when a broken pipeline goes green again.</span>
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
      <Check size={18} /> Tokens are stored on this device via <b>chrome.storage.local</b>, used
      read-only, and never synced or logged.
    </p>
  </div>
</div>

<ToastHost />

<style>
  .opt {
    min-height: 100vh;
    background: var(--canvas);
    color: var(--text);
    font-size: 14px;
  }
  .inner {
    max-width: 720px;
    margin: 0 auto;
    padding: 28px 24px 64px;
  }
  .masthead {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 8px;
  }
  .masthead h1 {
    margin: 0;
    font-size: 21px;
  }
  .masthead .tag {
    margin: 2px 0 0;
    font-size: 12.5px;
    color: var(--text-3);
  }
  .card {
    margin-top: 22px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    box-shadow: var(--shadow);
    overflow: hidden;
  }
  .card > h2 {
    display: flex;
    align-items: center;
    gap: 9px;
    margin: 0;
    padding: 15px 20px;
    border-bottom: 1px solid var(--border);
    font-size: 13px;
    font-weight: 680;
  }
  .card > h2 :global(svg) {
    color: var(--text-2);
  }
  .pad {
    padding: 18px 20px;
  }
  .pad h3 {
    margin: 0 0 14px;
    font-size: 13px;
  }

  .conn-list {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .conn {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 13px 20px;
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
  .conn-main {
    min-width: 0;
  }
  .conn-label {
    display: block;
    font-weight: 650;
    font-size: 13.5px;
  }
  .conn-host {
    font: 500 11.5px/1.3 var(--font-mono);
    color: var(--text-3);
  }
  .token-state {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin-left: auto;
    font-size: 12px;
    font-weight: 600;
  }
  .token-state.ok {
    color: var(--success);
  }
  .icon-btn {
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
  .icon-btn:hover {
    background: var(--hover);
    color: var(--text);
  }

  .permnote {
    margin: 4px 0 16px;
  }

  .repo-search {
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 10px 14px;
    border: 1px solid var(--border-2);
    border-radius: var(--radius);
    background: var(--bg);
    margin-bottom: 12px;
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
    font: 500 13px/1 var(--font-sans);
  }
  .repo-group {
    border: 1px solid var(--border);
    border-radius: var(--radius);
    overflow: hidden;
    margin-bottom: 12px;
  }
  .repo-grouphdr {
    padding: 8px 14px;
    background: var(--surface-2);
    border-bottom: 1px solid var(--border);
    font: 600 11px/1 var(--font-mono);
    color: var(--text-2);
  }
  .repo-empty {
    margin: 0;
    padding: 12px 14px;
    font-size: 12.5px;
    color: var(--text-3);
  }
  .repo-group :global(.btn) {
    margin: 10px 14px;
  }
  .repo-item {
    display: flex;
    align-items: center;
    gap: 11px;
    width: 100%;
    padding: 10px 14px;
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
  .rn {
    font-weight: 600;
    font-size: 13px;
  }
  .rb {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    margin-left: auto;
    flex: none;
    padding: 4px 8px;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    font: 500 11px/1 var(--font-mono);
    color: var(--text-2);
  }
  .rb :global(svg) {
    opacity: 0.7;
  }

  .set-row {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 15px 0;
    border-bottom: 1px solid var(--border);
  }
  .set-row:last-child {
    border-bottom: 0;
  }
  .si .t {
    display: block;
    font-weight: 600;
    font-size: 13.5px;
  }
  .si .d {
    font-size: 12px;
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
    font-size: 16px;
    cursor: pointer;
  }
  .stepper button:hover {
    background: var(--hover);
  }
  .stepper .val {
    min-width: 64px;
    text-align: center;
    font: 600 13px/34px var(--font-mono);
    border-left: 1px solid var(--border);
    border-right: 1px solid var(--border);
  }
  .stepper .val small {
    font-size: 10px;
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
    gap: 11px;
    align-items: flex-start;
    margin-top: 22px;
    padding: 14px 16px;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    background: var(--surface);
    font-size: 12.5px;
    line-height: 1.55;
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
