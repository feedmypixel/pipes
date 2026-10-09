<script lang="ts">
  import ChevronRight from '@lucide/svelte/icons/chevron-right'
</script>

<details class="token-help">
  <summary>
    <ChevronRight class="chevron" size={14} />
    <span>What permissions does my token need?</span>
  </summary>
  <ul>
    <li>
      <b>GitHub</b>: fine-grained with <b>Actions: read</b> +
      <b>Pull requests: read</b>.
    </li>
    <li><b>GitLab</b>: PAT with <b>read_api</b>.</li>
  </ul>
</details>

<style>
  .token-help {
    margin-top: var(--space-sm);
    font-size: var(--font-size-sm);
    color: var(--text-2);
  }
  .token-help summary {
    display: flex;
    align-items: center;
    gap: var(--space-2xs);
    cursor: pointer;
    color: var(--text-3);
    font-size: var(--font-size-xs);
    list-style: none;
  }
  .token-help summary::-webkit-details-marker {
    display: none;
  }
  .token-help summary :global(.chevron) {
    flex: none;
    transition: transform 0.12s;
  }
  .token-help[open] summary :global(.chevron) {
    transform: rotate(90deg);
  }
  @media (prefers-reduced-motion: reduce) {
    .token-help summary :global(.chevron) {
      transition: none;
    }
  }
  .token-help summary span {
    text-decoration: underline;
    text-underline-offset: 2px;
  }
  .token-help ul {
    margin: var(--space-sm) 0 0;
    padding: var(--space-md) var(--space-lg) var(--space-md) var(--space-4xl);
    background: var(--surface-2);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    list-style: disc;
    line-height: var(--leading-normal);
  }
  .token-help li + li {
    margin-top: var(--space-xs);
  }
  .token-help b {
    color: var(--text);
    font-weight: var(--weight-semibold);
  }
</style>
