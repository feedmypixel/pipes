<script lang="ts">
  import type { Pipeline, PipelineStatus } from '../providers/types'
  import StatusIcon from '../lib/components/StatusIcon.svelte'
  import RefChip from '../lib/components/RefChip.svelte'
  import RelativeTime from '../lib/components/RelativeTime.svelte'
  import Row from '../lib/components/Row.svelte'
  import Field from '../lib/components/forms/Field.svelte'
  import Input from '../lib/components/forms/Input.svelte'
  import PasswordInput from '../lib/components/forms/PasswordInput.svelte'
  import FormSummary from '../lib/components/forms/FormSummary.svelte'
  import Banner from '../lib/components/Banner.svelte'
  import ToastHost from '../lib/components/ToastHost.svelte'
  import { toastSuccess, toastError, toastInfo, toastUndo } from '../lib/toasts.svelte'

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

  const rows: { name: string; pipeline: Pipeline; dense?: boolean }[] = [
    { name: 'marketing-site', pipeline: pipeline('success', 'main', true, 90) },
    { name: 'status-api', pipeline: pipeline('failed', 'main', true, 4) },
    { name: 'pixel-cli', pipeline: pipeline('running', 'main', true, 1) },
    { name: 'status-api', pipeline: pipeline('failed', 'pr/210-retry', false, 9) },
    { name: 'status-api', pipeline: pipeline('success', 'fix/timeout', false, 120) },
    { name: 'pixel-cli', pipeline: pipeline('running', 'main', true, 1), dense: true },
    { name: 'database', pipeline: pipeline('failed', 'main', true, 30), dense: true }
  ]

  let goodHost = $state('github.com')
  let goodToken = $state('ghp_xxxxxxxxxxxx')
  let badHost = $state('')
  let badToken = $state('')
  const summaryErrors = [
    { name: 'host', message: 'Enter a host' },
    { name: 'token', message: 'Enter a token' }
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
    <p class="eyebrow">Row</p>
    <div class="rows">
      {#each rows as row (row.name + row.pipeline.id + (row.dense ? '-d' : ''))}
        <Row name={row.name} pipeline={row.pipeline} dense={row.dense} />
      {/each}
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
    gap: 16px;
    margin-bottom: 24px;
  }
  h1 {
    margin: 0;
    font-size: 21px;
  }
  .themes {
    display: inline-flex;
    gap: 2px;
    margin-left: auto;
    padding: 3px;
    background: var(--surface);
    border: 1px solid var(--border-2);
    border-radius: var(--radius);
  }
  .themes button {
    padding: 6px 12px;
    border: 0;
    border-radius: var(--radius);
    background: transparent;
    color: var(--text-2);
    font-size: 12px;
    cursor: pointer;
  }
  .themes button[aria-pressed='true'] {
    background: var(--brand);
    color: var(--brand-ink);
  }
  section {
    margin-bottom: 28px;
    padding: 18px 20px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
  }
  .eyebrow {
    margin: 0 0 14px;
    font: 600 11px/1 var(--font-mono);
    letter-spacing: 0.08em;
    color: var(--text-3);
  }
  .icons {
    display: flex;
    flex-wrap: wrap;
    gap: 20px;
  }
  .icon-cell {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }
  .icon-cell code {
    font: 500 10px/1 var(--font-mono);
    color: var(--text-3);
  }
  .rows {
    border: 1px solid var(--border);
    border-radius: var(--radius);
    overflow: hidden;
  }
  .inline {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 16px;
  }
  .stack {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .demo {
    padding: 7px 14px;
    border: 1px solid var(--border-2);
    border-radius: var(--radius);
    background: var(--surface-2);
    color: var(--text);
    font-size: 12px;
    cursor: pointer;
  }
  .swatches {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 10px;
  }
  .swatch {
    display: flex;
    align-items: center;
    gap: 9px;
  }
  .swatch .chip {
    width: 28px;
    height: 28px;
    border: 1px solid var(--border-2);
    border-radius: var(--radius);
    flex: none;
  }
  .swatch code {
    font: 500 11px/1 var(--font-mono);
    color: var(--text-2);
  }
</style>
