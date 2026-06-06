<script lang="ts">
  import type { Snippet } from 'svelte'
  import { setFieldContext } from './field-context'

  let {
    name,
    label,
    hint,
    error,
    optional = false,
    mono = false,
    below,
    children
  }: {
    name: string
    label: string
    hint?: string
    error?: string
    optional?: boolean
    mono?: boolean
    below?: { state: 'busy' | 'ok' | 'bad'; text: string }
    children: Snippet
  } = $props()

  const hintId = $derived(hint ? `${name}-hint` : undefined)
  const errorId = $derived(error ? `${name}-error` : undefined)
  const describedBy = $derived([hintId, errorId].filter(Boolean).join(' ') || undefined)

  setFieldContext(() => ({ id: name, describedBy, invalid: Boolean(error), mono }))
</script>

<div class="field" class:has-error={Boolean(error)}>
  <label for={name}>
    {label}{#if optional}<span class="opt"> (optional)</span>{/if}
  </label>
  {#if hint}<p class="hint" id={hintId}>{hint}</p>{/if}
  {#if error}<p class="ferror" id={errorId}>{error}</p>{/if}
  {@render children()}
  {#if below}<p class="below {below.state}" aria-live="polite">{below.text}</p>{/if}
</div>

<style>
  .field {
    display: grid;
    gap: 6px;
    margin-bottom: 16px;
  }
  label {
    font-size: 13px;
    font-weight: 650;
    color: var(--text);
  }
  .opt {
    font-weight: 500;
    color: var(--text-3);
  }
  .hint {
    margin: 0;
    font-size: 11.5px;
    line-height: 1.4;
    color: var(--text-3);
  }
  .ferror {
    margin: 0;
    font-size: 12px;
    line-height: 1.4;
    color: var(--failed);
  }
  .below {
    margin: 0;
    font-size: 11.5px;
    line-height: 1.4;
  }
  .below.busy {
    color: var(--text-3);
  }
  .below.ok {
    color: var(--text-2);
  }
  .below.bad {
    color: var(--failed);
  }
</style>
