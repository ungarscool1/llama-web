<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { env } from '$env/dynamic/public';
  import { Sidebar, SidebarGroup, SidebarItem, SidebarWrapper, DarkMode, Spinner, Navbar, NavHamburger } from 'flowbite-svelte';
  export let chats: any;
  $: activeUrl = $page.url.pathname;
  $: toggle = false;
  let userInfo = {
    authenticated: false,
    token: null,
  };

  onMount(() => {
    if (localStorage.getItem('userInfo')) {
      userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    }
    fetchChats();
  });
  async function fetchChats() {
    if (!userInfo.token) return;
    const req = await fetch(`${env.PUBLIC_API_URL}/chat`, {
      headers: {
        'Authorization': `Bearer ${userInfo.token}`
      }
    });
    if (!req.ok) return console.log("Error");
    const res = await req.json();
    chats = res;
  }
  async function deleteChat() {
    const id = $page.params.id;
    if (!id) return;
    await fetch(`${env.PUBLIC_API_URL}/chat/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${userInfo.token}`
      }
    });
    await fetchChats();
    goto('/chat');
  }
  
  async function deleteChats() {
    if (!chats) return;
    for (const chat of chats) {
      await fetch(`${env.PUBLIC_API_URL}/chat/${chat._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${userInfo.token}`
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
    console.log(chats)
    if (!chats) return 'New Chat';
    const id = $page.params.id;
    if (!id) return 'New Chat';
    const chat = chats.find((chat: any) => chat._id === id);
    if (!chat) return 'New Chat';
    return chat.message || 'New Chat';
  }
</script>
<div class="block lg:hidden">
  <Navbar color="dark">
    <NavHamburger on:click={toggleSidebar} />
    <p class="items-center justify-center">{getCurrentTitle()}</p>
    <button class="focus:outline-none whitespace-normal m-0.5 rounded-lg focus:ring-2 p-1.5 focus:ring-gray-400  hover:bg-gray-100 dark:hover:bg-gray-600 ml-3 md:hidden">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" class="bi bi-plus" viewBox="0 0 16 16">
        <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
      </svg>
    </button>
  </Navbar>
</div>
<Sidebar asideClass="fixed top-0 left-0 z-40 {toggle ? 'block' : 'hidden'} w-full lg:block lg:w-64 h-full max-h-screen min-h-screen transition-transform">
  <SidebarWrapper divClass="flex flex-col justify-between py-4 px-3 bg-gray-50 rounded dark:bg-gray-800 h-full max-h-full">
    <div class="flex flew-row justify-between">
      <a href="/playground" class="hidden lg:block text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-sm p-2.5 flex flex-col self-center">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-caret-left-fill" viewBox="0 0 16 16">
          <path d="m3.86 8.753 5.482 4.796c.646.566 1.658.106 1.658-.753V3.204a1 1 0 0 0-1.659-.753l-5.48 4.796a1 1 0 0 0 0 1.506z"/>
        </svg>
      </a>
      <button on:click={toggleSidebar} class="block lg:hidden text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-sm p-2.5 flex flex-col self-center">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-caret-left-fill" viewBox="0 0 16 16">
          <path d="m3.86 8.753 5.482 4.796c.646.566 1.658.106 1.658-.753V3.204a1 1 0 0 0-1.659-.753l-5.48 4.796a1 1 0 0 0 0 1.506z"/>
        </svg>
      </button>
      <a href="/chat" class="text-2xl dark:text-white m-2">LLaMa AI</a>
      <DarkMode btnClass="text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-sm p-2.5"/>
    </div>
    <SidebarGroup border={true} class="flex-none">
      <SidebarItem href="/chat" label="New chat" active={activeUrl === '/chat'}>
        <svelte:fragment slot="icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-plus-lg" viewBox="0 0 16 16">
            <path fill-rule="evenodd" d="M8 2a.5.5 0 0 1 .5.5v5h5a.5.5 0 0 1 0 1h-5v5a.5.5 0 0 1-1 0v-5h-5a.5.5 0 0 1 0-1h5v-5A.5.5 0 0 1 8 2Z"/>
          </svg>
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
            <a href="/chat/{chat._id}" class="flex justify-between items-center p-2 text-base font-normal text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg whitespace-nowrap {activeUrl === `/chat/${chat._id}` ? 'bg-gray-200 dark:bg-gray-700' : ''}">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="flex bi bi-chat-left" viewBox="0 0 16 16">
                <path d="M14 1a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H4.414A2 2 0 0 0 3 11.586l-2 2V2a1 1 0 0 1 1-1h12zM2 0a2 2 0 0 0-2 2v12.793a.5.5 0 0 0 .854.353l2.853-2.853A1 1 0 0 1 4.414 12H14a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2z"/>
              </svg>
              <span class="flex-1 overflow-hidden ml-3 mr-3">{chat.message}</span>
              {#if activeUrl === `/chat/${chat._id}`}
                <button class="flex btn btn-ghost btn-sm" on:click|preventDefault={deleteChat}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash" viewBox="0 0 16 16">
                    <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5Zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5Zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6Z"/>
                    <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1ZM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118ZM2.5 3h11V2h-11v1Z"/>
                  </svg>
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
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash" viewBox="0 0 16 16">
            <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5Zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5Zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6Z"/>
            <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1ZM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118ZM2.5 3h11V2h-11v1Z"/>
          </svg>
        </svelte:fragment>
      </SidebarItem>
    </SidebarGroup>
  </SidebarWrapper>
</Sidebar>