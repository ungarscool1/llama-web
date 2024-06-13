<script lang="ts">
  import * as marked from 'marked';
  import Codeblock from './components/codeblock.svelte';
  import Table from './components/table.svelte';
  import Avatar from '../../../../components/chat/avatar.svelte';
  import List from './components/list.svelte';
  import Bubble from './components/bubble.svelte';

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

{#if message.role === 'user'}
  <Bubble message={message.message} />
{:else}
  <div class="mx-auto flex flex-1 gap-3 text-base juice:gap-4 juice:md:gap-6 md:max-w-3xl lg:max-w-[40rem] xl:max-w-[48rem]">
    <div class="flex-shrink-0 flex flex-col relative items-end size-10">
      <Avatar username="llama-robot-assistant" />
    </div>
    <div class="flex-col gap-1 md:gap-3">
      <div class="flex flex-grow flex-col max-w-full">
        <div class="group min-h-[20px] flex flex-col items-start whitespace-pre-wrap break-words overflow-x-auto gap-2">
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
        </div>
      </div>
    </div>
  </div>
{/if}