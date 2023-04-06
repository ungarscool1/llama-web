<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { env } from '$env/dynamic/public';
  import { Sidebar, SidebarGroup, SidebarItem, SidebarWrapper, SidebarCta, DarkMode, Spinner } from 'flowbite-svelte';
  import SvelteMarkdown from 'svelte-markdown'

  $: activeUrl = $page.url.pathname;
  $: chats = undefined;
  $: messages = [];
  $: onChange(activeUrl);
  $: prompt = "";
  let isRequesting = false;
  let isPromptError = false;
  let userInfo = {
    authenticated: false,
    token: null,
  };

  onMount(() => {
    if (localStorage.getItem('userInfo')) {
      userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    }
    if (!userInfo.authenticated) {
      goto('/');
    }
    fetchChats();
    fetchMessage();
    // Do things
  });
  
  function onChange(...args) {
    const id = $page.params.id;
    if (!id) {
      messages = [];
      return;
    }
    fetchChats();
    fetchMessage();
  }
  
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
  
  async function fetchMessage() {
    const id = $page.params.id;
    if (!id || !userInfo.token) return;
    const req = await fetch(`${env.PUBLIC_API_URL}/chat/${id}`, {
      headers: {
        'Authorization': `Bearer ${userInfo.token}`
      }
    });
    if (!req.ok) return console.log("Error");
    const res = await req.json();
    messages = res.messages;
  }
  
  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === "Enter" && event.ctrlKey) {
      sendRequest();
    }
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
  
  async function sendRequest() {
    const xhr = new XMLHttpRequest();
    const id = $page.params.id;
    if (prompt.length === 0) {
      isPromptError = true;
      return;
    }
    messages = [...messages, {
      message: prompt,
      isBot: false
    }];
    xhr.open('POST', `${env.PUBLIC_API_URL}/chat`);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('Authorization', `Bearer ${userInfo.token}`);
    xhr.send(JSON.stringify({ messages: messages, id }));
    isRequesting = true;
    prompt = "";
    messages = [...messages, {
      message: 'Waiting for response...',
      isBot: true
    }]
    xhr.addEventListener('progress', (event) => {
      messages[messages.length - 1].message = xhr.responseText;
      if (xhr.responseText.includes('[[END OF CONVERSATION')) {
        const tmp = xhr.responseText.substring(xhr.responseText.indexOf('[[END OF CONVERSATION')).split('|')
        if (tmp.length === 2) {
          const conversationId = tmp[1].replace(']]', '')
          goto(`/chat/${conversationId}`)
        }
        isRequesting = false;
        const receivedMsg = xhr.responseText.substring(0, xhr.responseText.indexOf('[[END OF CONVERSATION')).trim()
        messages[messages.length - 1].message = receivedMsg
      }
    });
  }
  
  async function stopChat() {
    const req = await fetch(`${env.PUBLIC_API_URL}/chat/stop`, {
      headers: {
        'Authorization': `Bearer ${userInfo.token}`
      }
    });
    if (!req.ok) return console.log("Error");
    isRequesting = false;
  }
</script>


<main class="h-full w-screen overflow-y-none" on:keydown={handleKeyDown}>
<Sidebar asideClass="fixed top-0 left-0 z-40 w-64 h-screen max-h-screen min-h-screen transition-transform">
  <SidebarWrapper divClass="flex flex-col justify-between py-4 px-3 bg-gray-50 rounded dark:bg-gray-800 h-full max-h-full">
    <div class="flex flew-row justify-between">
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
      <SidebarItem href={env.PUBLIC_SSO_ACCOUNT_SETTINGS_URL} label="Settings" active={false}>
        <svelte:fragment slot="icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-person-gear" viewBox="0 0 16 16">
            <path d="M11 5a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM8 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm.256 7a4.474 4.474 0 0 1-.229-1.004H3c.001-.246.154-.986.832-1.664C4.484 10.68 5.711 10 8 10c.26 0 .507.009.74.025.226-.341.496-.65.804-.918C9.077 9.038 8.564 9 8 9c-5 0-6 3-6 4s1 1 1 1h5.256Zm3.63-4.54c.18-.613 1.048-.613 1.229 0l.043.148a.64.64 0 0 0 .921.382l.136-.074c.561-.306 1.175.308.87.869l-.075.136a.64.64 0 0 0 .382.92l.149.045c.612.18.612 1.048 0 1.229l-.15.043a.64.64 0 0 0-.38.921l.074.136c.305.561-.309 1.175-.87.87l-.136-.075a.64.64 0 0 0-.92.382l-.045.149c-.18.612-1.048.612-1.229 0l-.043-.15a.64.64 0 0 0-.921-.38l-.136.074c-.561.305-1.175-.309-.87-.87l.075-.136a.64.64 0 0 0-.382-.92l-.148-.045c-.613-.18-.613-1.048 0-1.229l.148-.043a.64.64 0 0 0 .382-.921l-.074-.136c-.306-.561.308-1.175.869-.87l.136.075a.64.64 0 0 0 .92-.382l.045-.148ZM14 12.5a1.5 1.5 0 1 0-3 0 1.5 1.5 0 0 0 3 0Z"/>
          </svg>
        </svelte:fragment>
      </SidebarItem>
      <SidebarItem href="/logout" label="Logout" active={false}>
        <svelte:fragment slot="icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-box-arrow-right" viewBox="0 0 16 16">
            <path fill-rule="evenodd" d="M10 12.5a.5.5 0 0 1-.5.5h-8a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 .5.5v2a.5.5 0 0 0 1 0v-2A1.5 1.5 0 0 0 9.5 2h-8A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h8a1.5 1.5 0 0 0 1.5-1.5v-2a.5.5 0 0 0-1 0v2z"/>
            <path fill-rule="evenodd" d="M15.854 8.354a.5.5 0 0 0 0-.708l-3-3a.5.5 0 0 0-.708.708L14.293 7.5H5.5a.5.5 0 0 0 0 1h8.793l-2.147 2.146a.5.5 0 0 0 .708.708l3-3z"/>
          </svg>
        </svelte:fragment>
      </SidebarItem>
      <SidebarCta label="Beta">
        <p class="mb-3 text-sm text-blue-900 dark:text-blue-400">
          Free Preview. Your feedback will help us to improve.
        </p>
      </SidebarCta>
    </SidebarGroup>
  </SidebarWrapper>
</Sidebar>

<div id="content" class="p-4 sm:ml-64 flex mt-2 flex-col justify-between w-100 mx-auto overflow-y-none">
  <div id="chat-messages" class="overflow-y-auto px-10 mb-6 h-[calc(100vh-9rem)]">
    {#if messages}
      {#each messages as message}
        <div class="flex mb-2 flex-row">
          <div class="flex">
            <img src="{message.isBot ? '/robot.svg' : '/person.svg'}" alt="{message.isBot ? 'Robot' : 'User'}" class="me-2 rounded-sm w-[50px] h-[50px]">
          </div>
          <p class="flex-1 mb-0 ml-1 dark:text-white text-black">
            <SvelteMarkdown source={message.message} />
          </p>
        </div>
      {/each}
    {/if}
  </div>
  <div class="flex justify-center items-center">
    <div class="w-full ml-5 mr-5">
      <div class="flex">
        <textarea disabled={isRequesting} draggable="false" rows="2" class="m-0 w-full resize-none border-1 border-solid rounded-l-md p-2 bg-transparent p-0 pr-7 focus:ring-0 focus-visible:ring-0 dark:bg-transparent dark:text-white pl-2 md:pl-0 {isPromptError ? 'border-red-700' : ''}" style="max-height: 200px;" placeholder="Enter some text..." bind:value={prompt}></textarea>
        {#if !isRequesting}
          <button class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-r-md" on:click|preventDefault={sendRequest}>Send</button>
        {:else}
          <button class="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-r-md" on:click|preventDefault={stopChat}>Stop</button>
        {/if}
      </div>
    </div>
  </div>
</div>
</main>
