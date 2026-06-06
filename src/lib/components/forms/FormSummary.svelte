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
