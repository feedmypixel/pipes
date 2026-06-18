<script lang="ts">
  import Search from '@lucide/svelte/icons/search'
  import UserRound from '@lucide/svelte/icons/user-round'
  import X from '@lucide/svelte/icons/x'
  import type { SvelteSet } from 'svelte/reactivity'
  import type { PipelineStatus } from '../../providers/types'
  import { BRANCH_STATE_ORDER } from '../group'

  // Controlled: the parent owns `search`, `scope`, and the `allowed` set (so it can filter with
  // them); this component renders the controls and mutates the shared state.
  let {
    search = $bindable(''),
    scope = $bindable('all'),
    allowed
  }: {
    search?: string
    scope?: 'all' | 'mine'
    allowed: SvelteSet<PipelineStatus>
  } = $props()

  function toggleState(state: PipelineStatus) {
    if (allowed.has(state)) {
      allowed.delete(state)
    } else {
      allowed.add(state)
    }
  }

  function toggleAll() {
    const turnOn = !BRANCH_STATE_ORDER.every((state) => allowed.has(state))
    for (const state of BRANCH_STATE_ORDER) {
      if (turnOn) {
        allowed.add(state)
      } else {
        allowed.delete(state)
      }
    }
  }

  const allStatesOn = $derived(BRANCH_STATE_ORDER.every((state) => allowed.has(state)))
</script>

<div class="controls">
  <span class="search">
    <Search size={14} />
    <input
      type="text"
      placeholder="Filter repositories…"
      aria-label="Filter repositories"
      bind:value={search}
    />
    {#if search}
      <button class="search-clear" aria-label="Clear filter" onclick={() => (search = '')}>
        <X size={14} />
      </button>
    {/if}
  </span>
</div>
<div class="filters">
  <div class="scope-wrap">
    <div class="scope" role="group" aria-label="Show whose pull requests and merge requests">
      <button class="seg" aria-pressed={scope === 'all'} onclick={() => (scope = 'all')}>All</button
      >
      <button class="seg" aria-pressed={scope === 'mine'} onclick={() => (scope = 'mine')}>
        <UserRound size={13} />
        <span>Mine</span>
      </button>
    </div>
  </div>
  <div class="pills" role="group" aria-label="Show branch states">
    {#each BRANCH_STATE_ORDER as state (state)}
      <button
        class="chip"
        class:on={allowed.has(state)}
        aria-pressed={allowed.has(state)}
        onclick={() => toggleState(state)}
      >
        {state}
      </button>
    {/each}
    <button class="toggle-all" onclick={toggleAll}>
      {allStatesOn ? 'Clear all' : 'Select all'}
    </button>
  </div>
</div>

<style>
  .controls {
    display: flex;
    gap: var(--space-sm);
    padding: var(--space-md) var(--space-md) var(--space-xs);
  }
  .search {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    flex: 1;
    /* Fixed height so the row never shifts when the clear button appears or while typing. */
    height: 2rem;
    box-sizing: border-box;
    padding: 0 var(--space-md);
    border: 1px solid var(--border-2);
    border-radius: var(--radius);
    background: var(--bg);
  }
  .search:focus-within {
    outline: 2px solid var(--brand);
    outline-offset: 1px;
  }
  .search :global(svg) {
    color: var(--text-3);
    flex: none;
  }
  .search input {
    flex: 1;
    min-width: 0;
    border: 0;
    background: transparent;
    outline: 0;
    color: var(--text);
    font: var(--weight-medium) var(--font-size-base) / var(--leading-none) var(--font-sans);
  }
  .search-clear {
    display: grid;
    place-items: center;
    flex: none;
    width: 20px;
    height: 20px;
    padding: 0;
    border: 0;
    border-radius: var(--radius-pill);
    background: transparent;
    color: var(--text-3);
    cursor: pointer;
  }
  .search-clear:hover {
    background: var(--hover);
    color: var(--text);
  }

  .filters {
    display: flex;
    align-items: flex-start;
    gap: var(--space-sm);
    padding: var(--space-xs) var(--space-md) var(--space-md);
    border-bottom: 1px solid var(--border);
  }
  /* Scope axis (All | Mine), divided from the status pills like toggle-all, on the other side. */
  .scope-wrap {
    display: inline-flex;
    align-items: center;
    flex: none;
    padding-right: var(--space-sm);
    border-right: 1px solid var(--border);
  }
  .scope {
    display: inline-flex;
    align-items: center;
    flex: none;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    overflow: hidden;
    background: var(--bg);
  }
  .seg {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2xs);
    /* Tight horizontal padding so the scope + status row wraps to two lines as late as possible. */
    padding: var(--space-3xs) var(--space-xs);
    border: 0;
    background: transparent;
    color: var(--text-3);
    font: var(--weight-regular) var(--font-size-sm) / var(--leading-none) var(--font-sans);
    cursor: pointer;
  }
  .seg + .seg {
    border-left: 1px solid var(--border);
  }
  .seg :global(svg) {
    flex: none;
  }
  .seg:hover {
    color: var(--text-2);
  }
  .seg[aria-pressed='true'] {
    background: var(--control-on);
    color: var(--control-on-ink);
    font-weight: var(--weight-medium);
  }
  .seg:focus-visible {
    outline: 2px solid var(--brand);
    outline-offset: -2px;
    border-radius: 2px;
  }
  .pills {
    display: flex;
    flex-wrap: wrap;
    gap: calc(var(--space-3xs) + 0.0625rem);
  }
  .chip {
    /* Tight horizontal padding (was --space-md) to delay the two-line wrap in narrow windows. */
    padding: var(--space-3xs) var(--space-sm);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    background: transparent;
    color: var(--text-3);
    font: var(--weight-regular) var(--font-size-sm) / var(--leading-none) var(--font-sans);
    text-transform: capitalize;
    cursor: pointer;
  }
  .chip:hover {
    color: var(--text-2);
    border-color: var(--border-2);
  }
  .chip.on {
    background: var(--control-on);
    color: var(--control-on-ink);
    border-color: var(--control-on-edge);
    font-weight: var(--weight-medium);
  }
  .toggle-all {
    align-self: stretch;
    margin-left: var(--space-2xs);
    padding: 0 0 0 var(--space-sm);
    border: 0;
    border-left: 1px solid var(--border);
    background: transparent;
    color: var(--link);
    font: var(--weight-medium) var(--font-size-sm) / var(--leading-none) var(--font-sans);
    cursor: pointer;
  }
  .toggle-all:hover {
    text-decoration: underline;
    text-underline-offset: 2px;
  }
</style>
