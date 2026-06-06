<script lang="ts">
  import type { HTMLInputAttributes } from 'svelte/elements'
  import Input from './Input.svelte'

  let { value = $bindable(''), ...rest }: { value?: string } & HTMLInputAttributes = $props()

  let show = $state(false)
</script>

<div class="pw-wrap">
  <Input {...rest} type={show ? 'text' : 'password'} autocomplete="new-password" bind:value />
  <button class="pw-toggle" type="button" onclick={() => (show = !show)}>
    {show ? 'Hide' : 'Show'}
  </button>
</div>

<style>
  .pw-wrap {
    position: relative;
    display: flex;
  }
  /* the input is an <Input> child; reserve room for the toggle without leaking globals */
  .pw-wrap :global(input) {
    flex: 1;
    padding-right: 60px;
  }
  .pw-toggle {
    position: absolute;
    right: 6px;
    top: 50%;
    transform: translateY(-50%);
    padding: 6px 8px;
    border: 0;
    background: transparent;
    color: var(--link);
    font: 600 12px/1 var(--font-sans);
    cursor: pointer;
  }
  .pw-toggle:hover {
    text-decoration: underline;
  }
</style>
