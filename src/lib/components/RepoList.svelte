<script lang="ts">
  import ChevronRight from '@lucide/svelte/icons/chevron-right'
  import ExternalLink from '@lucide/svelte/icons/external-link'
  import type { OwnerGroup } from '../group'
  import type { PipelineStatus } from '../../providers/types'
  import RepoCard from './RepoCard.svelte'

  let {
    groups,
    allowed,
    storageKey,
    defaultCollapsed = false
  }: {
    groups: OwnerGroup[]
    allowed: ReadonlySet<PipelineStatus>
    storageKey: string
    defaultCollapsed?: boolean
  } = $props()

  let repoCollapsed = $state<Record<string, boolean>>({})
  let ownerCollapsed = $state<Record<string, boolean>>({})
  let loaded = $state(false)

  function readJson(key: string): Record<string, boolean> {
    try {
      return JSON.parse(localStorage.getItem(key) ?? '{}')
    } catch {
      return {}
    }
  }

  // Load persisted collapse state once; reading the prop here keeps it reactive-clean.
  $effect(() => {
    repoCollapsed = readJson(`${storageKey}-repo-collapsed`)
    ownerCollapsed = readJson(`${storageKey}-owner-collapsed`)
    loaded = true
  })
  $effect(() => {
    if (loaded) {
      localStorage.setItem(`${storageKey}-repo-collapsed`, JSON.stringify(repoCollapsed))
      localStorage.setItem(`${storageKey}-owner-collapsed`, JSON.stringify(ownerCollapsed))
    }
  })

  // Collapsing an owner shuts the section and every repo inside it. Re-opening the
  // owner reveals the section only — repos stay shut, never auto-expand.
  function toggleOwner(group: OwnerGroup) {
    ownerCollapsed[group.owner] = !ownerCollapsed[group.owner]
    for (const view of group.repos) {
      repoCollapsed[view.repo.id] = true
    }
  }

  function ownerUrl(group: OwnerGroup): string | undefined {
    const url = group.repos[0]?.repo.webUrl
    if (!url) {
      return undefined
    }
    try {
      return `${new URL(url).origin}/${group.owner}`
    } catch {
      return undefined
    }
  }
</script>

{#each groups as group (group.owner)}
  <section>
    <div class="owner-row">
      <button
        class="owner"
        class:open={!ownerCollapsed[group.owner]}
        aria-expanded={!ownerCollapsed[group.owner]}
        onclick={() => toggleOwner(group)}
      >
        <ChevronRight class="owner-caret" size={13} />
        <span class="owner-name">{group.owner}</span>
        <span class="count">{group.repos.length}</span>
      </button>
      {#if ownerUrl(group)}
        <a
          class="owner-link"
          href={ownerUrl(group)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Open {group.owner} on the provider"
        >
          <ExternalLink size={12} />
        </a>
      {/if}
    </div>
    {#if !ownerCollapsed[group.owner]}
      {#each group.repos as view (view.repo.id)}
        <RepoCard
          {view}
          {allowed}
          collapsed={repoCollapsed[view.repo.id] ?? defaultCollapsed}
          onToggle={() =>
            (repoCollapsed[view.repo.id] = !(repoCollapsed[view.repo.id] ?? defaultCollapsed))}
        />
      {/each}
    {/if}
  </section>
{/each}

<style>
  .owner-row {
    position: sticky;
    top: 0;
    z-index: 1;
    display: flex;
    align-items: center;
    background: var(--surface);
    border-bottom: 1px solid var(--border);
  }
  .owner {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
    gap: var(--space-2xs);
    padding: var(--space-xs) var(--space-sm) var(--space-xs) var(--space-sm);
    border: 0;
    background: transparent;
    color: var(--text-2);
    cursor: pointer;
    text-align: left;
  }
  .owner :global(.owner-caret) {
    flex: none;
    color: var(--text-3);
    transition: transform 0.12s;
  }
  .owner.open :global(.owner-caret) {
    transform: rotate(90deg);
  }
  .owner-name {
    font: var(--weight-bold) var(--font-size-2xs) / var(--leading-none) var(--font-mono);
    letter-spacing: 0.07em;
  }
  .count {
    margin-left: auto;
    font: var(--weight-semibold) var(--font-size-2xs) / var(--leading-none) var(--font-mono);
    color: var(--text-3);
    border: 1px solid var(--border);
    border-radius: var(--radius-pill);
    padding: var(--space-3xs) var(--space-sm);
  }
  .owner-link {
    flex: none;
    display: grid;
    place-items: center;
    width: 24px;
    height: 24px;
    margin-right: var(--space-sm);
    border-radius: var(--radius-pill);
    color: var(--text-3);
  }
  .owner-link:hover {
    background: var(--hover);
    color: var(--text);
  }
  @media (prefers-reduced-motion: reduce) {
    .owner :global(.owner-caret) {
      transition: none;
    }
  }
</style>
