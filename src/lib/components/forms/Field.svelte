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
    gap: var(--space-xs);
    margin-bottom: var(--space-2xl);
  }
  label {
    font-size: var(--font-size-base);
    font-weight: var(--weight-bold);
    color: var(--text);
  }
  .opt {
    font-weight: var(--weight-medium);
    color: var(--text-3);
  }
  .hint {
    margin: 0;
    font-size: var(--font-size-xs);
    line-height: var(--leading-normal);
    color: var(--text-3);
  }
  .ferror {
    margin: 0;
    font-size: var(--font-size-sm);
    line-height: var(--leading-normal);
    color: var(--failed);
  }
  .below {
    margin: 0;
    font-size: var(--font-size-xs);
    line-height: var(--leading-normal);
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
