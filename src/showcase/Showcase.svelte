<script lang="ts">
  import type { Pipeline, PipelineStatus } from '../providers/types'
  import StatusIcon from '../lib/components/StatusIcon.svelte'
  import RefChip from '../lib/components/RefChip.svelte'
  import RelativeTime from '../lib/components/RelativeTime.svelte'
  import RepoCard from '../lib/components/RepoCard.svelte'
  import TopAlerts from '../lib/components/TopAlerts.svelte'
  import { ALL_BRANCH_STATES, type RepoView } from '../lib/group'
  import Field from '../lib/components/forms/Field.svelte'
  import Input from '../lib/components/forms/Input.svelte'
  import PasswordInput from '../lib/components/forms/PasswordInput.svelte'
  import FormSummary from '../lib/components/forms/FormSummary.svelte'
  import Banner from '../lib/components/Banner.svelte'
  import ToastHost from '../lib/components/ToastHost.svelte'
  import Toast from '../lib/components/Toast.svelte'
  import { toastSuccess, toastError, toastInfo, toastUndo } from '../lib/toasts.svelte'
  import type { ToastItem } from '../lib/toasts.svelte'
  import Button from '../lib/components/Button.svelte'
  import PermissionNote from '../lib/components/PermissionNote.svelte'
  import Plus from '@lucide/svelte/icons/plus'

  type ThemeChoice = 'auto' | 'light' | 'dark'
  const themeChoices: ThemeChoice[] = ['auto', 'light', 'dark']
  let theme = $state<ThemeChoice>('auto')

  $effect(() => {
    const root = document.documentElement
    if (theme === 'auto') {
      root.removeAttribute('data-theme')
    } else {
      root.dataset.theme = theme
    }
  })

  const statuses: PipelineStatus[] = [
    'success',
    'failed',
    'running',
    'pending',
    'canceled',
    'skipped',
    'unknown'
  ]

  const swatches = [
    '--bg',
    '--surface',
    '--surface-2',
    '--canvas',
    '--hover',
    '--border',
    '--border-2',
    '--text',
    '--text-2',
    '--text-3',
    '--brand',
    '--link',
    '--success',
    '--failed',
    '--running',
    '--pending',
    '--neutral'
  ]

  function pipeline(
    status: PipelineStatus,
    ref: string,
    isDefaultBranch: boolean,
    agoMinutes: number
  ): Pipeline {
    return {
      id: `${ref}-${status}`,
      ref,
      isDefaultBranch,
      status,
      webUrl: 'https://example.test/run',
      sha: 'abc1234',
      title: `${ref} ${status}`,
      updatedAt: new Date(Date.now() - agoMinutes * 60_000).toISOString()
    }
  }

  function view(displayName: string, primary: Pipeline, branches: Pipeline[] = []): RepoView {
    return {
      repo: {
        id: `o/${displayName}`,
        accountId: 'a',
        name: `o/${displayName}`,
        defaultBranch: 'main',
        webUrl: 'https://example.test'
      },
      displayName,
      primary,
      active: branches.filter((p) => p.status === 'failed' || p.status === 'running'),
      collapsed: branches.filter((p) => p.status !== 'failed' && p.status !== 'running')
    }
  }
  const repoViews: RepoView[] = [
    view('status-api', pipeline('failed', 'main', true, 4), [
      pipeline('failed', 'pr/210-retry', false, 9),
      pipeline('success', 'fix/timeout', false, 120)
    ]),
    view('marketing-site', pipeline('success', 'main', true, 90)),
    view('pixel-cli', pipeline('running', 'main', true, 1))
  ]
  let repoCollapsed = $state<Record<string, boolean>>({})

  let goodHost = $state('github.com')
  let goodToken = $state('ghp_xxxxxxxxxxxx')
  let badHost = $state('')
  let badToken = $state('')
  const summaryErrors = [
    { name: 'host', message: 'Enter a host' },
    { name: 'token', message: 'Enter a token' }
  ]

  // Live demo: a real one-field form. Submit empty to invoke errors; submit valid
  // to see the in-flight disabled state resolve to a success banner.
  let demoToken = $state('')
  let demoError = $state<string | undefined>(undefined)
  let demoSummary = $state<{ name: string; message: string }[]>([])
  let demoSubmitting = $state(false)
  let demoDone = $state(false)

  function demoBlur() {
    demoError = demoToken.trim() ? undefined : 'Enter a token'
  }
  function demoInput() {
    if (demoError && demoToken.trim()) {
      demoError = undefined
    }
  }
  async function demoSubmit() {
    demoDone = false
    demoError = demoToken.trim() ? undefined : 'Enter a token'
    demoSummary = demoError ? [{ name: 'demo-token', message: demoError }] : []
    if (demoError) {
      document.getElementById('demo-token')?.focus()
      return
    }
    demoSubmitting = true
    await new Promise((resolve) => setTimeout(resolve, 900))
    demoSubmitting = false
    demoDone = true
    toastSuccess('Saved')
  }

  // Static toasts so every variant is visible at once (live ones auto-dismiss).
  const staticToasts: ToastItem[] = [
    { id: -1, variant: 'success', title: 'Connection added', message: 'github.com · feedmypixel' },
    { id: -2, variant: 'error', title: 'Validation failed', message: 'Host did not respond' },
    { id: -3, variant: 'info', title: 'Permission requested' },
    {
      id: -4,
      variant: 'info',
      title: 'Connection removed',
      undo: true,
      action: { label: 'Undo', run: () => {} }
    }
  ]
</script>

<div class="page">
  <header>
    <h1>Pipes components</h1>
    <div class="themes" role="group" aria-label="Theme">
      {#each themeChoices as choice (choice)}
        <button type="button" aria-pressed={theme === choice} onclick={() => (theme = choice)}>
          {choice}
        </button>
      {/each}
    </div>
  </header>

  <section>
    <p class="eyebrow">StatusIcon</p>
    <div class="icons">
      {#each statuses as status (status)}
        <div class="icon-cell">
          <StatusIcon {status} size={30} />
          <StatusIcon {status} size={20} />
          <StatusIcon {status} size={18} />
          <code>{status}</code>
        </div>
      {/each}
    </div>
  </section>

  <section>
    <p class="eyebrow">RepoCard</p>
    <div class="rows">
      {#each repoViews as repoView (repoView.repo.id)}
        <RepoCard
          view={repoView}
          allowed={ALL_BRANCH_STATES}
          collapsed={repoCollapsed[repoView.repo.id] ?? false}
          onToggle={() => (repoCollapsed[repoView.repo.id] = !repoCollapsed[repoView.repo.id])}
        />
      {/each}
    </div>
  </section>

  <section>
    <p class="eyebrow">TopAlerts (side-panel / popup top messages)</p>
    <div class="stack">
      <div class="surface-frame">
        <TopAlerts connectionIssues={[]} mainFailing={0} ready={true} onOpenSettings={() => {}} />
      </div>
      <div class="surface-frame">
        <TopAlerts connectionIssues={[]} mainFailing={2} ready={true} onOpenSettings={() => {}} />
      </div>
      <div class="surface-frame">
        <TopAlerts connectionIssues={[]} mainFailing={1} ready={true} onOpenSettings={() => {}} />
      </div>
      <div class="surface-frame">
        <TopAlerts
          connectionIssues={[{ id: 'a', label: 'work', error: 'token invalid or expired' }]}
          mainFailing={0}
          ready={false}
          onOpenSettings={() => {}}
        />
      </div>
      <div class="surface-frame">
        <TopAlerts
          connectionIssues={[{ id: 'a', label: 'work', error: 'token invalid or expired' }]}
          mainFailing={2}
          ready={true}
          onOpenSettings={() => {}}
        />
      </div>
    </div>
  </section>

  <section>
    <p class="eyebrow">RefChip · RelativeTime</p>
    <div class="inline">
      <RefChip ref="main" />
      <RefChip ref="feature/a-very-long-branch-name-that-truncates" />
      <RelativeTime iso={new Date(Date.now() - 5 * 60_000).toISOString()} />
      <RelativeTime iso={new Date(Date.now() - 5 * 3_600_000).toISOString()} />
    </div>
  </section>

  <section>
    <p class="eyebrow">Forms · valid</p>
    <Field name="host-ok" label="Host" hint="github.com, gitlab.com, or a self-hosted origin">
      <Input bind:value={goodHost} type="text" placeholder="github.com" />
    </Field>
    <Field
      name="token-ok"
      label="Personal access token"
      hint="read-only scope; never synced, never logged"
      below={{ state: 'ok', text: 'github.com reachable · token valid' }}
    >
      <PasswordInput bind:value={goodToken} autocomplete="new-password" />
    </Field>
    <Field
      name="host-busy"
      label="Host"
      hint="below line, busy state"
      below={{ state: 'busy', text: 'Checking github.com…' }}
    >
      <Input bind:value={goodHost} type="text" placeholder="github.com" />
    </Field>
  </section>

  <section>
    <p class="eyebrow">Forms · live (press submit)</p>
    {#if demoDone}<Banner variant="ok">Saved.</Banner>{/if}
    <FormSummary errors={demoSummary} />
    <Field
      name="demo-token"
      label="Token"
      hint="submit empty to invoke errors; type to clear"
      error={demoError}
    >
      <Input
        bind:value={demoToken}
        type="text"
        placeholder="paste a token"
        onblur={demoBlur}
        oninput={demoInput}
      />
    </Field>
    <div class="button-group">
      <Button variant="primary" submitting={demoSubmitting} onclick={demoSubmit}>
        {demoSubmitting ? 'Saving…' : 'Submit'}
      </Button>
    </div>
  </section>

  <section>
    <p class="eyebrow">Buttons</p>
    <div class="button-group">
      <Button variant="primary"><Plus size={14} /> Add connection</Button>
      <Button variant="secondary">Validate</Button>
      <Button variant="primary" submitting>Adding connection…</Button>
      <Button variant="primary" disabled>Disabled</Button>
    </div>
  </section>

  <section>
    <p class="eyebrow">Permission note</p>
    <PermissionNote />
  </section>

  <section>
    <p class="eyebrow">Forms · errors</p>
    <FormSummary errors={summaryErrors} />
    <Field
      name="host"
      label="Host"
      hint="github.com, gitlab.com, or a self-hosted origin"
      error="Enter a host"
    >
      <Input bind:value={badHost} type="text" placeholder="github.com" />
    </Field>
    <Field
      name="token"
      label="Personal access token"
      hint="read-only scope; never synced, never logged"
      error="Enter a token"
      below={{ state: 'bad', text: 'Host did not respond' }}
    >
      <PasswordInput bind:value={badToken} autocomplete="new-password" />
    </Field>
  </section>

  <section>
    <p class="eyebrow">Banners</p>
    <div class="stack">
      <Banner variant="ok">Connection added.</Banner>
      <Banner variant="err">Could not reach host. Check the origin and try again.</Banner>
    </div>
  </section>

  <section>
    <p class="eyebrow">Toasts</p>
    <div class="toast-statics">
      {#each staticToasts as item (item.id)}
        <Toast {item} onclose={() => {}} />
      {/each}
    </div>
    <div class="inline">
      <button type="button" class="demo" onclick={() => toastSuccess('Settings saved')}>
        success
      </button>
      <button
        type="button"
        class="demo"
        onclick={() => toastError('Validation failed', 'Host did not respond')}
      >
        error
      </button>
      <button type="button" class="demo" onclick={() => toastInfo('Permission requested')}>
        info
      </button>
      <button
        type="button"
        class="demo"
        onclick={() => toastUndo('Connection removed', () => toastSuccess('Restored'))}
      >
        undo
      </button>
    </div>
  </section>

  <section>
    <p class="eyebrow">Tokens</p>
    <div class="swatches">
      {#each swatches as token (token)}
        <div class="swatch">
          <span class="chip" style="background: var({token})"></span>
          <code>{token}</code>
        </div>
      {/each}
    </div>
  </section>
</div>

<ToastHost />

<style>
  .page {
    max-width: 760px;
    margin: 0 auto;
    padding: 28px 24px 64px;
    background: var(--canvas);
    min-height: 100vh;
  }
  header {
    display: flex;
    align-items: center;
    gap: var(--space-2xl);
    margin-bottom: var(--space-4xl);
  }
  h1 {
    margin: 0;
    font-size: var(--font-size-2xl);
  }
  .themes {
    display: inline-flex;
    gap: var(--space-3xs);
    margin-left: auto;
    padding: var(--space-3xs);
    background: var(--surface);
    border: 1px solid var(--border-2);
    border-radius: var(--radius);
  }
  .themes button {
    padding: var(--space-xs) var(--space-lg);
    border: 0;
    border-radius: var(--radius);
    background: transparent;
    color: var(--text-2);
    font-size: var(--font-size-sm);
    cursor: pointer;
  }
  .themes button[aria-pressed='true'] {
    background: var(--brand);
    color: var(--brand-ink);
  }
  section {
    margin-bottom: var(--space-5xl);
    padding: var(--space-2xl) var(--space-3xl);
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
  }
  .eyebrow {
    margin: 0 0 var(--space-xl);
    font: var(--weight-semibold) var(--font-size-xs) / var(--leading-none) var(--font-mono);
    letter-spacing: 0.08em;
    color: var(--text-3);
  }
  .icons {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-3xl);
  }
  .icon-cell {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-sm);
  }
  .icon-cell code {
    font: var(--weight-medium) var(--font-size-2xs) / var(--leading-none) var(--font-mono);
    color: var(--text-3);
  }
  .rows,
  .surface-frame {
    border: 1px solid var(--border);
    border-radius: var(--radius);
    overflow: hidden;
  }
  .inline {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-2xl);
  }
  .stack {
    display: flex;
    flex-direction: column;
    gap: var(--space-lg);
  }
  .button-group {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-md);
    align-items: center;
    margin-top: var(--space-2xl);
  }
  .toast-statics {
    display: flex;
    flex-direction: column;
    gap: var(--toast-gap);
    margin-bottom: var(--space-2xl);
  }
  .demo {
    padding: var(--space-sm) var(--space-xl);
    border: 1px solid var(--border-2);
    border-radius: var(--radius);
    background: var(--surface-2);
    color: var(--text);
    font-size: var(--font-size-sm);
    cursor: pointer;
  }
  .swatches {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: var(--space-md);
  }
  .swatch {
    display: flex;
    align-items: center;
    gap: var(--space-md);
  }
  .swatch .chip {
    width: 28px;
    height: 28px;
    border: 1px solid var(--border-2);
    border-radius: var(--radius);
    flex: none;
  }
  .swatch code {
    font: var(--weight-medium) var(--font-size-xs) / var(--leading-none) var(--font-mono);
    color: var(--text-2);
  }
</style>
