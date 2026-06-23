<script lang="ts">
  import type { Author } from '../../providers/types'

  let { author, dense = false }: { author?: Author; dense?: boolean } = $props()

  const name = $derived(author?.name ?? author?.login ?? '')

  function initials(value: string): string {
    const parts = value.trim().split(/\s+/).filter(Boolean)
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return value.trim().slice(0, 2).toUpperCase()
  }
</script>

{#snippet body()}
  <span class="avatar">
    {#if author?.avatarUrl}
      <img src={author.avatarUrl} alt="" />
    {:else}
      <span class="ini">{initials(name)}</span>
    {/if}
  </span>
  <span class="author-name">{author?.login}</span>
{/snippet}

{#if author}
  {#if author.profileUrl}
    <a
      class="author"
      class:dense
      href={author.profileUrl}
      target="_blank"
      rel="noopener noreferrer"
      title={name}
      aria-label={`Open ${name}'s profile, opens in a new tab`}
    >
      {@render body()}
    </a>
  {:else}
    <span class="author" class:dense title={name}>{@render body()}</span>
  {/if}
{/if}

<style>
  .author {
    position: relative;
    z-index: 1;
    display: inline-flex;
    align-items: center;
    gap: var(--space-2xs);
    flex: none;
    color: var(--text-2);
    text-decoration: none;
  }
  .avatar {
    position: relative;
    display: grid;
    place-items: center;
    width: 18px;
    height: 18px;
    flex: none;
    border-radius: 50%;
    overflow: hidden;
    background: var(--surface-2);
    box-shadow: 0 0 0 1px var(--border) inset;
  }
  .dense .avatar {
    width: 16px;
    height: 16px;
  }
  .avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    filter: grayscale(1);
    opacity: 0.82;
    transition:
      filter 0.12s ease,
      opacity 0.12s ease;
  }
  .ini {
    font: var(--weight-semibold) 8px / 1 var(--font-sans);
    color: var(--text-2);
    text-transform: uppercase;
  }
  .author-name {
    max-width: 64px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font: var(--weight-medium) var(--font-size-2xs) / 1 var(--font-sans);
    color: var(--text-2);
  }
  a.author:hover .avatar img,
  a.author:focus-visible .avatar img {
    filter: none;
    opacity: 1;
  }
  a.author:hover .avatar {
    box-shadow: 0 0 0 1px var(--border-2) inset;
  }
  a.author:hover .author-name {
    color: var(--text);
    text-decoration: underline;
    text-underline-offset: 2px;
  }
  a.author:focus-visible {
    outline: 2px solid var(--brand);
    outline-offset: 2px;
    border-radius: 2px;
  }
  @container (max-width: 336px) {
    .author-name {
      display: none;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .avatar img {
      transition: none;
    }
  }
</style>
