<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import Generate from '../../components/playground/generate.svelte';
  import Embedding from '../../components/playground/embedding.svelte';
  import Chat from '../../components/playground/chat.svelte';
  import * as Tooltip from "$lib/components/ui/tooltip/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import ScrollText from "lucide-svelte/icons/scroll-text";
  import Binary from "lucide-svelte/icons/binary";
  import MessageSquare from "lucide-svelte/icons/message-square";

  let userInfo = {
    authenticated: false,
    token: null
  };
  
  let subPage = 'generate';

  onMount(() => {
    if (localStorage.getItem('userInfo')) {
      userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    }
    if (!userInfo.authenticated) {
      goto('/');
    }
  });
</script>
<div class="grid h-full w-full pl-[53px]">
  <aside class="inset-y fixed left-0 z-20 flex h-full flex-col border-r">
    <nav class="grid gap-1 p-2">
      <Tooltip.Root>
        <Tooltip.Trigger asChild let:builder>
          <Button
            variant="ghost"
            size="icon"
            class="rounded-lg {subPage === 'generate' ? 'bg-muted' : ''}"
            aria-label="Generate text"
            builders={[builder]}
            on:click={() => subPage = 'generate'}
          >
            <ScrollText class="w-5 h-5" />
          </Button>
        </Tooltip.Trigger>
        <Tooltip.Content side="right" sideOffset={5}>Generate text</Tooltip.Content>
      </Tooltip.Root>
      <Tooltip.Root>
        <Tooltip.Trigger asChild let:builder>
          <Button
            variant="ghost"
            size="icon"
            class="rounded-lg {subPage === 'embedding' ? 'bg-muted' : ''}"
            aria-label="Embeddings"
            builders={[builder]}
            on:click={() => subPage = 'embedding'}
          >
            <Binary class="w-5 h-5" />
          </Button>
        </Tooltip.Trigger>
        <Tooltip.Content side="right" sideOffset={5}>Embeddings</Tooltip.Content>
      </Tooltip.Root>
      <Tooltip.Root>
        <Tooltip.Trigger asChild let:builder>
          <Button
            variant="ghost"
            size="icon"
            class="rounded-lg {subPage === 'chat' ? 'bg-muted' : ''}"
            aria-label="Chat"
            builders={[builder]}
            on:click={() => subPage = 'chat'}
          >
            <MessageSquare class="w-5 h-5" />
          </Button>
        </Tooltip.Trigger>
        <Tooltip.Content side="right" sideOffset={5}>Chat</Tooltip.Content>
      </Tooltip.Root>
    </nav>
  </aside>
  <main class="grid flex-1 gap-4 overflow-auto p-4 md:grid-cols-2 lg:grid-cols-3">
    {#if subPage === 'generate'}
      <Generate />
    {:else if subPage === 'embedding'}
      <Embedding />
    {:else if subPage === 'chat'}
      <Chat />
    {/if}
  </main>
</div>
