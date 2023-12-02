<script lang="ts">
  import * as marked from 'marked';
  import Codeblock from './messageComponent/codeblock.svelte';
  import Table from './messageComponent/table.svelte';

  export let message: {
    message: string;
    role: string;
  };
  $: tokens = marked.lexer(message.message);
</script>

<div class="flex mb-2 flex-row">
  <div class="flex w-12 h-12 me-1">
    <img src="{message.role === 'assistant' ? '/robot.svg' : '/person.svg'}" alt="{message.role === 'assistant' ? 'Robot' : 'User'}" class="rounded-sm w-full h-full object-cover">
  </div>
  <p class="flex-1 mb-0 ml-1 dark:text-white text-black w-[75%]">
    {#each tokens as token}
      {#if token.type === "code"}
        <Codeblock code={token.text} language={token.lang} />
      {:else if token.type === "table"}
        <Table rows={token.rows} header={token.header} />
      {:else}
        {@html marked.parse(token.raw)}
      {/if}
    {/each}
  </p>
</div>