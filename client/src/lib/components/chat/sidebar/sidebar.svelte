<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { env } from '$env/dynamic/public';
  import { ShareModal } from '$lib/components/chat/shareModal';
  import { SettingsModal } from '$lib/components/chat/settingsModal';
  import { Button } from "$lib/components/ui/button/index.js";
  import PanelLeftClose from "lucide-svelte/icons/panel-left-close";
  import PanelLeftOpen from "lucide-svelte/icons/panel-left-open";
  import SquarePen from "lucide-svelte/icons/square-pen";
  import LoaderCircle from "lucide-svelte/icons/loader-circle";
  import Settings from "lucide-svelte/icons/settings";
  import Trash from "lucide-svelte/icons/trash";
  import Menu from "lucide-svelte/icons/menu";
  import Chat from './components/chat.svelte';
  import * as Sheet from "$lib/components/ui/sheet";
  
  let chats: any;
  $: activeUrl = $page.url.pathname;
  $: toggle = false;
  $: navBarTitle = 'New chat';
  $: onChange(activeUrl);
  $: openDropdown = false;
  $: showShareModal = false;
  $: showSettingsModal = false;
  let userInfo = {
    authenticated: false,
    token: null
  };

  onMount(() => {
    if (localStorage.getItem('userInfo')) {
      userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    }
    fetchChats().then(() => {
      getCurrentTitle();
    });
  });
  async function onChange(...args) {
    await fetchChats();
    getCurrentTitle();
    if (toggle) toggleSidebar();
    openDropdown = false;
  }
  async function fetchChats() {
    if (!userInfo.authenticated) return;
    const req = await fetch(`${env.PUBLIC_API_URL}/chat`, {
      headers: {
        Authorization: `Bearer ${userInfo.token}`
      }
    });
    if (!req.ok) return console.log('Error');
    const res = await req.json();
    chats = res;
  }
  async function deleteChat() {
    const id = $page.params.id;
    if (!id) return;
    await fetch(`${env.PUBLIC_API_URL}/chat/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${userInfo.token}`
      }
    });
    await fetchChats();
    goto('/chat');
  }

  async function deleteChats() {
    if (!chats) return;
    for (const chat of chats) {
      await fetch(`${env.PUBLIC_API_URL}/chat/${chat.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${userInfo.token}`
        }
      });
    }
    await fetchChats();
    goto('/chat');
  }

  const toggleSidebar = () => {
    console.log('Toggling sidebar');
    toggle = !toggle;
  };
  function getCurrentTitle() {
    if (!chats) {
      navBarTitle = 'New chat';
      return;
    }
    const id = $page.params.id;
    if (!id) {
      navBarTitle = 'New chat';
      return;
    }
    const chat = chats.find((chat: any) => chat.id === id);
    if (!chat) {
      console.log(`No chat found for the id ${id}`, chats)
      navBarTitle = 'New chat';
      return;
    }
    navBarTitle = chat.message;
  }
</script>

<aside class="overflow-x-hidden hidden w-screen {toggle ? '' : 'md:block'} md:w-64 h-[100dvh] max-h-screen min-h-screen transition-transform bg-muted/50">
  <div class="flex flex-col justify-between py-4 px-3 h-[100dvh] max-h-[100dvh] w-screen md:w-auto">
    <div class="py-2">
      <div class="flex justify-between items-center">
        <Button variant="primary" class="justify-start hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-sm p-2.5 flex flex-col self-center hover:bg-gray-300 dark:hover:bg-gray-700" on:click={toggleSidebar}>
          <PanelLeftClose class="size-6" />
        </Button>
        <a href="/chat" class="justify-start hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-sm p-2.5 flex flex-col self-center hover:bg-gray-300 dark:hover:bg-gray-700">
          <SquarePen class="size-5" />
        </a>
      </div>
    </div>
    <div class="py-2{chats !== undefined && chats.length > 0 ? ' space-y-2 overflow-y-auto flex-1 mt-2 items-center justify-center' : ''}">
      {#if chats === undefined}
        <div class="text-center flex justify-center items-center w-full"><LoaderCircle class="size-5 animate-spin" /></div>
      {:else if chats.length === 0}
        <div class="text-center text-gray-500 dark:text-gray-400">No chats yet</div>
      {:else}
        {#each chats as chat}
          <Chat chat={chat} active={activeUrl === `/chat/${chat.id}`} bind:showShareModal deleteChat={deleteChat} />
        {/each}
      {/if}
    </div>
    <div class="py-2">
      <Button variant="primary" class="justify-start hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-sm p-2.5 flex flex-row self-center hover:bg-gray-300 dark:hover:bg-gray-700 w-full" on:click={() => { showSettingsModal = true; }}>
        <Settings class="size-5 mr-2" />
        Settings
      </Button>
      <Button variant="primary" class="justify-start hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-sm p-2.5 flex flex-row self-center hover:bg-gray-300 dark:hover:bg-gray-700 w-full" on:click={deleteChats}>
        <Trash class="size-5 mr-2" />
        Clear conversations
      </Button>
    </div>
  </div>
</aside>

<Sheet.Root>
  <Sheet.Trigger asChild let:builder>
    <Button
      variant="outline"
      size="icon"
      class="shrink-0 md:hidden"
      builders={[builder]}
    >
      <Menu class="h-5 w-5" />
      <span class="sr-only">Toggle navigation menu</span>
    </Button>
  </Sheet.Trigger>
  <Sheet.Content side="left" class="flex flex-col justify-between py-4 px-3 h-[100dvh]">
    <Sheet.Header class="flex-row justify-between items-center">
      <Button variant="primary" class="justify-start hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-sm p-2.5 flex flex-col self-center hover:bg-gray-300 dark:hover:bg-gray-700" on:click={toggleSidebar}>
        <PanelLeftClose class="size-6" />
      </Button>
      <a href="/chat" class="justify-start hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-sm p-2.5 flex flex-col self-center hover:bg-gray-300 dark:hover:bg-gray-700">
        <SquarePen class="size-5" />
      </a>
    </Sheet.Header>
    <nav class="py-2{chats !== undefined && chats.length > 0 ? ' space-y-2 overflow-y-auto flex-1 mt-2 items-center justify-center' : ''}">
        {#if chats === undefined}
          <div class="text-center flex justify-center items-center w-full"><LoaderCircle class="size-5 animate-spin" /></div>
        {:else if chats.length === 0}
          <div class="text-center text-gray-500 dark:text-gray-400">No chats yet</div>
        {:else}
          {#each chats as chat}
            <Chat chat={chat} active={activeUrl === `/chat/${chat.id}`} bind:showShareModal deleteChat={deleteChat} />
          {/each}
        {/if}
    </nav>
  </Sheet.Content>
</Sheet.Root>

<ShareModal bind:modalShow={showShareModal} id={$page.params.id} />
<SettingsModal bind:modalShow={showSettingsModal} />