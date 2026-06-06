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

  setFieldContext(() => ({ id: name, describedBy, invalid: Boolean(error) }))
</script>

<div class="field" class:has-error={Boolean(error)} class:field-mono={mono}>
  <label for={name}>
    {label}{#if optional}<span class="opt"> (optional)</span>{/if}
  </label>
  {#if hint}<p class="hint" id={hintId}>{hint}</p>{/if}
  {#if error}<p class="ferror" id={errorId}>{error}</p>{/if}
  {@render children()}
  {#if below}<p class="below {below.state}" aria-live="polite">{below.text}</p>{/if}
</div>
