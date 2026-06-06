<script lang="ts">
  let { errors }: { errors: { name: string; message: string }[] } = $props()
</script>

{#if errors.length > 0}
  <div class="form-summary" role="alert">
    <h4>There's a problem</h4>
    <ul>
      {#each errors as item (item.name)}
        <li><a href="#{item.name}">{item.message}</a></li>
      {/each}
    </ul>
  </div>
{/if}

<style>
  .form-summary {
    margin-bottom: var(--space-3xl);
    padding: var(--space-xl) var(--space-2xl);
    border: 1px solid var(--failed-line);
    border-radius: var(--radius);
    background: var(--failed-bg);
  }
  h4 {
    margin: 0 0 var(--space-sm);
    font-size: var(--font-size-base);
    font-weight: var(--weight-heavy);
    color: var(--failed);
  }
  ul {
    display: grid;
    gap: var(--space-xs);
    margin: 0;
    padding-left: 0;
    list-style: none;
  }
  a {
    color: var(--failed);
    font-size: var(--font-size-base);
    text-decoration: underline;
  }
  a:hover {
    text-decoration: none;
  }
</style>
