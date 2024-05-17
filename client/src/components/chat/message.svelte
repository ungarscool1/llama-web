<script lang="ts">
  import * as marked from 'marked';
  import Codeblock from './messageComponent/codeblock.svelte';
  import Table from './messageComponent/table.svelte';
  import Avatar from './avatar.svelte';
  import List from './messageComponent/list.svelte';

  function sanitize(text: string) {
		return text
			.replace(/<\|[a-z]*$/, "")
			.replace(/<\|[a-z]+\|$/, "")
			.replace(/<$/, "")
			.replaceAll(/<\|[a-z]+\|>/g, " ")
			.replaceAll(/<br\s?\/?>/gi, "\n")
			.replaceAll("<", "&lt;");
	}
	function unsanitize(text: string) {
		return text.replaceAll("&lt;", "<");
	}
  export let username: string;
  export let message: {
    message: string;
    role: string;
  };
  $: tokens = marked.lexer(sanitize(message.message));
</script>

<div class="flex mb-2 flex-row w-full">
  <div class="flex w-12 h-12 me-1">
    {#if message.role === 'assistant'}
      <Avatar username="llama-robot-assistant" />
    {:else}
      <Avatar {username} />
    {/if}
  </div>
  <p class="flex-1 mb-0 ml-1 dark:text-white text-black whitespace-pre-line w-3/4">
    {#each tokens as token}
      {#if token.type === "code"}
        <Codeblock code={unsanitize(token.text)} language={token.lang} />
      {:else if token.type === "table"}
        <Table rows={token.rows} header={token.header} />
      {:else if token.type === "list"}
        <List ordered={token.ordered} items={token.items} />
      {:else}
        {@html marked.parse(token.raw)}
      {/if}
    {/each}
  </p>
</div>