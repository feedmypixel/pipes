<script lang="ts">
  // Test-only: renders a real Input/PasswordInput inside a Field so the
  // Field-context wiring (id, aria-describedby, aria-invalid) can be exercised.
  // Imported by *.svelte.test.ts only; never referenced by app entries.
  import Field from './Field.svelte'
  import Input from './Input.svelte'
  import PasswordInput from './PasswordInput.svelte'

  let {
    name,
    label,
    hint = undefined,
    error = undefined,
    password = false
  }: { name: string; label: string; hint?: string; error?: string; password?: boolean } = $props()

  let value = $state('')
</script>

<Field {name} {label} {hint} {error}>
  {#if password}
    <PasswordInput bind:value />
  {:else}
    <Input bind:value />
  {/if}
</Field>
