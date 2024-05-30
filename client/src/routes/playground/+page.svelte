<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { browser } from '$app/environment';
  import Generate from '../../components/playground/generate.svelte';
  import Embedding from '$lib/components/playground/embeddings/embeddings.svelte';
  import Chat from '$lib/components/playground/chat/chat.svelte';
  import * as Tooltip from "$lib/components/ui/tooltip/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import ScrollText from "lucide-svelte/icons/scroll-text";
  import Binary from "lucide-svelte/icons/binary";
  import MessageSquare from "lucide-svelte/icons/message-square";
  import * as AlertDialog from "$lib/components/ui/alert-dialog";

  let userInfo = {
    authenticated: false,
    token: null
  };
  
  let subPage = 'generate';
  let isMobile = false;
  if (browser) {
    isMobile = window.innerWidth < 768;
    window.addEventListener('resize', () => {
      isMobile = window.innerWidth < 768;
    });
  }

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
    <AlertDialog.Root open={isMobile}>
      <AlertDialog.Content>
        <AlertDialog.Header>
          <AlertDialog.Title>Mobile Warning</AlertDialog.Title>
          <AlertDialog.Description>
            The playground is not optimized for mobile devices. Are you sure you want to continue?
          </AlertDialog.Description>
        </AlertDialog.Header>
        <AlertDialog.Footer>
          <AlertDialog.Cancel>Continue</AlertDialog.Cancel>
          <AlertDialog.Action on:click={() => {goto('/chat')}}>Go to chat</AlertDialog.Action>
        </AlertDialog.Footer>
      </AlertDialog.Content>
    </AlertDialog.Root>
    {#if subPage === 'generate'}
      <Generate />
    {:else if subPage === 'embedding'}
      <Embedding />
    {:else if subPage === 'chat'}
      <Chat />
    {/if}
  </main>
</div>
