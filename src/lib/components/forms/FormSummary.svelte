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
    margin-bottom: 18px;
    padding: 14px 16px;
    border: 1px solid var(--failed-line);
    border-radius: var(--radius);
    background: var(--failed-bg);
  }
  h4 {
    margin: 0 0 8px;
    font-size: 13px;
    font-weight: 680;
    color: var(--failed);
  }
  ul {
    display: grid;
    gap: 5px;
    margin: 0;
    padding-left: 0;
    list-style: none;
  }
  a {
    color: var(--failed);
    font-size: 12.5px;
    text-decoration: underline;
  }
  a:hover {
    text-decoration: none;
  }
</style>
