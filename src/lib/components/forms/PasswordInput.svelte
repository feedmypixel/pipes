<script lang="ts">
  import type { HTMLInputAttributes } from 'svelte/elements'
  import Input from './Input.svelte'

  let { value = $bindable(''), ...rest }: { value?: string } & HTMLInputAttributes = $props()

  let show = $state(false)
</script>

<div class="password-wrap">
  <Input {...rest} type={show ? 'text' : 'password'} autocomplete="new-password" bind:value />
  <button class="password-toggle" type="button" onclick={() => (show = !show)}>
    {show ? 'Hide' : 'Show'}
  </button>
</div>

<style>
  .password-wrap {
    position: relative;
    display: flex;
  }
  /* the input is an <Input> child; reserve room for the toggle without leaking globals */
  .password-wrap :global(input) {
    flex: 1;
    padding-right: 60px;
  }
  .password-toggle {
    position: absolute;
    right: var(--space-xs);
    top: 50%;
    transform: translateY(-50%);
    padding: var(--space-xs) var(--space-sm);
    border: 0;
    background: transparent;
    color: var(--link);
    font: var(--weight-semibold) var(--font-size-sm) / var(--leading-none) var(--font-sans);
    cursor: pointer;
  }
  .password-toggle:hover {
    text-decoration: underline;
  }
</style>
