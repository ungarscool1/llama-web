<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { env } from '$env/dynamic/public';
  import {
    Sidebar,
    SidebarGroup,
    SidebarItem,
    SidebarWrapper,
    DarkMode,
    Spinner,
    Navbar,
    NavHamburger,
    Dropdown,
    DropdownItem
  } from 'flowbite-svelte';
  import ThreeHorizontalDots from '../icons/ThreeHorizontalDotsIcon.svelte';
  import Trash from '../icons/TrashIcon.svelte';
  import Share from '../icons/ShareIcon.svelte';
  import PlusIcon from '../icons/PlusIcon.svelte';
  import PlusIconLg from '../icons/PlusIconLg.svelte';
  import ChatLeftIcon from '../icons/ChatLeftIcon.svelte';
  import ShareModal from './shareModal.svelte';
  export let chats: any;
  $: activeUrl = $page.url.pathname;
  $: toggle = false;
  $: navBarTitle = 'New chat';
  $: onChange(activeUrl);
  $: openDropdown = false;
  $: showShareModal = false;
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
  function onChange(...args) {
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
      navBarTitle = 'New chat';
      return;
    }
    navBarTitle = chat.message;
  }
</script>

<div class="block md:hidden {!toggle ? 'block' : 'hidden'}">
  <Navbar color="dark">
    <div
      class="mx-auto flex flex-row justify-between items-center container whitespace-nowrap text-base font-normal text-gray-900 dark:text-white whitespace-nowrap"
    >
      <NavHamburger onClick={toggleSidebar} />
      <p class="items-center justify-center overflow-hidden ml-3 mr-3">{navBarTitle}</p>
      <a
        href="/chat"
        class="focus:outline-none whitespace-normal m-0.5 rounded-lg focus:ring-2 p-1.5 focus:ring-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600 ml-3 md:hidden"
      >
        <PlusIcon />
      </a>
    </div>
  </Navbar>
</div>
<Sidebar
  asideClass="flex overflow-x-hidden {toggle
    ? 'block'
    : 'hidden'} w-screen md:block md:w-64 h-[100dvh] max-h-screen min-h-screen transition-transform"
>
  <SidebarWrapper
    divClass="flex flex-col justify-between py-4 px-3 bg-gray-50 rounded dark:bg-gray-800 h-[100dvh] max-h-[100dvh] w-screen md:w-auto"
  >
    <div class="flex flew-row justify-between">
      <a
        href="/playground"
        class="hidden md:block text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-sm p-2.5 flex flex-col self-center"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          fill="currentColor"
          class="bi bi-caret-left-fill"
          viewBox="0 0 16 16"
        >
          <path
            d="m3.86 8.753 5.482 4.796c.646.566 1.658.106 1.658-.753V3.204a1 1 0 0 0-1.659-.753l-5.48 4.796a1 1 0 0 0 0 1.506z"
          />
        </svg>
      </a>
      <button
        on:click={toggleSidebar}
        class="block md:hidden text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-sm p-2.5 flex flex-col self-center"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          fill="currentColor"
          class="bi bi-caret-left-fill"
          viewBox="0 0 16 16"
        >
          <path
            d="m3.86 8.753 5.482 4.796c.646.566 1.658.106 1.658-.753V3.204a1 1 0 0 0-1.659-.753l-5.48 4.796a1 1 0 0 0 0 1.506z"
          />
        </svg>
      </button>
      <a href="/chat" class="text-2xl dark:text-white m-2">LLaMa AI</a>
      <DarkMode
        btnClass="text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-sm p-2.5"
      />
    </div>
    <SidebarGroup border={true} class="flex-none">
      <SidebarItem href="/chat" label="New chat" active={activeUrl === '/chat'}>
        <svelte:fragment slot="icon">
          <PlusIconLg />
        </svelte:fragment>
      </SidebarItem>
    </SidebarGroup>
    <SidebarGroup class="overflow-y-auto flex-1 mt-2 items-center justify-center">
      {#if chats === undefined}
        <div class="text-center"><Spinner /></div>
      {:else if chats.length === 0}
        <div class="text-center text-gray-500 dark:text-gray-400">No chats yet</div>
      {:else}
        {#each chats as chat}
          <li>
            <a
              href="/chat/{chat.id}"
              class="flex justify-between items-center p-2 text-base font-normal text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg whitespace-nowrap {activeUrl ===
              `/chat/${chat.id}`
                ? 'bg-gray-200 dark:bg-gray-700'
                : ''}"
            >
              <ChatLeftIcon />
              <span class="flex-1 overflow-hidden ml-3 mr-3">{chat.message}</span>
              {#if activeUrl === `/chat/${chat.id}`}
                <button
                  class="flex btn btn-ghost btn-sm"
                  on:click|preventDefault={() => {
                    openDropdown = !openDropdown;
                  }}><ThreeHorizontalDots /></button
                >
                <Dropdown open={openDropdown} class="py-2">
                  <DropdownItem
                    on:click={(e) => {
                      e.preventDefault();
                      openDropdown = false;
                      showShareModal = true;
                    }}
                    class="flex items-center font-normal py-2 px-4 text-sm hover:bg-gray-100 dark:hover:bg-gray-600 w-full text-base dark:hover:bg-gray-700"
                    ><Share /> &nbsp; Share</DropdownItem
                  >
                  <DropdownItem
                    on:click={(e) => {
                      e.preventDefault();
                      openDropdown = false;
                      deleteChat();
                    }}
                    class="text-red-500 flex items-center font-normal py-2 px-4 text-sm hover:bg-gray-100 dark:hover:bg-gray-600 w-full text-base dark:hover:bg-gray-700"
                  >
                    <Trash /> &nbsp; Delete chat</DropdownItem
                  >
                </Dropdown>
                <button class="flex btn btn-ghost btn-sm" on:click|preventDefault={deleteChat}>
                </button>
              {/if}
            </a>
          </li>
        {/each}
      {/if}
    </SidebarGroup>
    <SidebarGroup border={true}>
      <SidebarItem on:click={deleteChats} label="Clear conversations" active={false}>
        <svelte:fragment slot="icon">
          <Trash />
        </svelte:fragment>
      </SidebarItem>
    </SidebarGroup>
  </SidebarWrapper>
</Sidebar>

<ShareModal bind:modalShow={showShareModal} id={$page.params.id} />