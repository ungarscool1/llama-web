<script lang="ts">
  import * as marked from 'marked';
  import Codeblock from './messageComponent/codeblock.svelte';
  import Table from './messageComponent/table.svelte';
  import Avatar from './avatar.svelte';

  export let username: string;
  export let message: {
    message: string;
    role: string;
  };
  $: tokens = marked.lexer(message.message);
</script>

<div class="flex mb-2 flex-row w-full lg:w-[75%]">
  <div class="flex w-12 h-12 me-1">
    {#if message.role === 'assistant'}
      <Avatar username="llama-robot-assistant" />
    {:else}
      <Avatar {username} />
    {/if}
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