<script lang="ts">
  import * as marked from 'marked';
  import Codeblock from './components/codeblock.svelte';
  import Table from './components/table.svelte';
  import Avatar from '../../../../components/chat/avatar.svelte';
  import List from './components/list.svelte';
  import Quote from './components/quote.svelte';
  import Heading from './components/heading.svelte';
  import Bubble from './components/bubble.svelte';
  import Alert from '$lib/components/playground/alert/alert.svelte';

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
  export let message: {
    message: string;
    role: string;
  };
  $: tokens = marked.lexer(sanitize(message.message));
</script>

{#if message.role === 'user'}
  <Bubble message={message.message} onRemove={() => {}} />
{:else}
  <div class="flex mb-2 flex-row w-full px-2 md:px-0">
    <div class="flex-shrink-0 flex flex-col relative items-end size-10 mr-4">
      <Avatar username="llama-robot-assistant" />
    </div>
    <div class="flex-1 mb-0 ml-1 mt-2 dark:text-white text-black whitespace-pre-line w-3/4">
      {#if message.message.startsWith('<!--ERROR:')}
        <Alert errorMessage={message.message.replace('<!--ERROR: ', '').replace('-->', '')}/>
      {:else}
        {#each tokens as token}
          {token.type}
          {#if token.type === "code"}
            <Codeblock code={unsanitize(token.text)} language={token.lang} />
          {:else if token.type === "table"}
            <Table rows={token.rows} header={token.header} />
          {:else if token.type === "list"}
            <List ordered={token.ordered} items={token.items} />
          {:else if token.type === "blockquote"}
            <Quote quote={token.text} />
          {:else if token.type === "heading"}
            <Heading level={token.depth} text={token.text} />
          {:else}
            {@html marked.parse(token.raw)}
          {/if}
        {/each}
      {/if}
    </div>
  </div>
{/if}