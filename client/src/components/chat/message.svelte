<script lang="ts">
  import * as marked from 'marked';
  import Codeblock from './codeblock.svelte';

  export let message: {
    message: string;
    role: string;
  };
  $: tokens = marked.lexer(message.message);
</script>

<div class="flex mb-2 flex-row">
  <div class="flex">
    <img src="{message.role === 'assistant' ? '/robot.svg' : '/person.svg'}" alt="{message.role === 'assistant' ? 'Robot' : 'User'}" class="me-2 rounded-sm w-[50px] h-[50px]">
  </div>
  <p class="flex-1 mb-0 ml-1 dark:text-white text-black w-[95%]">
    {#each tokens as token}
      {#if token.type === "code"}
        <Codeblock code={token.text} />
      {:else}
        {@html marked.parse(token.raw)}
      {/if}
    {/each}
  </p>
</div>