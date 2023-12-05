<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { env } from '$env/dynamic/public';
  import Sidebar from '../../../components/chat/sidebar.svelte';
  import Message from '../../../components/chat/message.svelte';
  import Welcome from '../../../components/chat/welcome.svelte';

  $: activeUrl = $page.url.pathname;
  $: chats = undefined;
  $: messages = [];
  $: onChange(activeUrl);
  $: prompt = "";
  $: model = "";
  let isRequesting = false;
  let isPromptError = false;
  let isError = false;
  let chatBox: HTMLDivElement;
  let userInfo = {
    authenticated: false,
    token: null,
    name: '',
  };
  let atBottom = true;
  
  function goDown() {
    chatBox.scroll({
      top: chatBox.scrollHeight,
      behavior: 'smooth',
    })
  }
  function checkScroll() {
    atBottom = chatBox.scrollTop >= chatBox.scrollHeight - chatBox.clientHeight - 1;
  }

  onMount(() => {
    if (localStorage.getItem('userInfo')) {
      userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
      if (userInfo.token)
        userInfo = JSON.parse(decodeURIComponent(escape(atob(userInfo.token.split('.')[1]))));
      else
        userInfo.name = 'Anonymous';
    }
    if (!userInfo.authenticated) {
      localStorage.setItem('previousPage', $page.url.pathname);
      goto('/');
    }
    fetchChats();
    fetchMessage();
    pingApi();
    chatBox.addEventListener('scroll', checkScroll);
    checkScroll();
  });
  
  async function onChange(...args) {
    const id = $page.params.id;
    if (!id) {
      messages = [];
      return;
    }
    await fetchChats();
    await fetchMessage();
    if (chatBox){
      checkScroll();
      chatBox.scroll({
        top: 0,
        behavior: 'instant',
      })
    }
  }
  
  async function pingApi() {
    const req = await fetch(`${env.PUBLIC_API_URL}/`, {
      headers: {
        'Authorization': `Bearer ${userInfo.token}`
      }
    });
    if (!req.ok) {
      localStorage.setItem('previousPage', $page.url.pathname);
      return goto('/');
    }
  }
  
  async function fetchChats() {
    if (!userInfo.authenticated) return;
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
    if (!id || !userInfo.authenticated) return;
    const req = await fetch(`${env.PUBLIC_API_URL}/chat/${id}`, {
      headers: {
        'Authorization': `Bearer ${userInfo.token}`
      }
    });
    if (!req.ok) return console.log("Error");
    const res = await req.json();
    model = res.model;
    messages = res.messages;
    chatBox.scroll({ top: chatBox.scrollHeight, behavior: 'smooth' });
  }
  
  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
      sendRequest();
    }
  }
  
  async function sendRequest() {
    const xhr = new XMLHttpRequest();
    const id = $page.params.id;
    if (!isError && prompt.length === 0) {
      isPromptError = true;
      return;
    }
    if (!isError) {
      messages = [...messages, {
        message: prompt,
        role: 'user'
      }];
    }
    xhr.open('POST', `${env.PUBLIC_API_URL}/chat`);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('Authorization', `Bearer ${userInfo.token}`);
    xhr.send(JSON.stringify({ message: isError ? messages[messages.length - 2].message : prompt, id, model }));
    isRequesting = true;
    prompt = "";
    if (!isError) {
      messages = [...messages, {
        message: 'Waiting for response...',
        role: 'assistant'
      }];
    } else {
      messages[messages.length - 1].message = 'Retrying...';
    }
    chatBox.scroll({ top: chatBox.scrollHeight, behavior: 'smooth' });
    xhr.addEventListener('progress', (event) => {
      let id: string | undefined;
      if (xhr.status === 200) {
        messages[messages.length - 1].message = xhr.responseText;
        if ((id = xhr.responseText.match(/\[\[(\w{24})\]\]/)?.[1]) !== undefined) {
          goto(`/chat/${id}`);
        }
      }
    });
    
    xhr.onloadend = () => {
      if (xhr.status !== 200) {
        const error = JSON.parse(xhr.responseText);
        messages[messages.length - 1].message = `<div class="p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400" role="alert">
          ${error.message}
        </div>`;
        isError = true;
      } else {
        isError = false;
      }
      isRequesting = false;
    };
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


<main class="h-[100dvh] w-screen overflow-hidden relative z-0 md:flex" on:keydown={handleKeyDown}>
<Sidebar {chats} />
<div id="content" class="relative px-2 md:px-0 flex pt-1 h-full max-w-full flex-1 flex-col overflow-hidden">
  <div id="chat-messages" class="overflow-y-auto md:px-10 mb-1 h-[calc(100dvh-8rem)] md:h-[calc(100dvh-4.5rem)] w-full lg:flex lg:flex-col lg:items-center" bind:this={chatBox}>
    {#if messages.length > 0}
      {#each messages as message}
        <Message {message} username={userInfo.name} />
      {/each}
    {:else}
      <Welcome bind:model={model} />
    {/if}
  </div>
  <div class="flex justify-center items-center">
    <div class="w-full mx-5">
      <div class="flex flex-col w-full flex-grow relative">
        <textarea disabled={isRequesting} draggable="false" rows="1" class="m-0 w-full resize-none border-1 border-solid rounded-md py-[10px] pr-10 pl-3 md:py-3.5 md:pr-12 md:pl-4 bg-transparent focus:ring-0 focus-visible:ring-0 dark:bg-transparent dark:text-white {isPromptError ? 'border-red-700' : ''}" style="max-height: 200px;" placeholder="Enter some text..." bind:value={prompt}></textarea>
        {#if !isRequesting}
          <button class="absolute md:right-3 md:bottom-[0.6875rem] right-2 bottom-[0.4375rem] bg-blue-500 hover:bg-blue-600 dark:hover:bg-gray-900 dark:bg-white disabled:opacity-10 text-white font-bold py-2 px-2 rounded-md" on:click|preventDefault={sendRequest} disabled={prompt.length === 0}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-arrow-up dark:text-black" viewBox="0 0 16 16">
              <path fill-rule="evenodd" d="M8 15a.5.5 0 0 0 .5-.5V2.707l3.146 3.147a.5.5 0 0 0 .708-.708l-4-4a.5.5 0 0 0-.708 0l-4 4a.5.5 0 1 0 .708.708L7.5 2.707V14.5a.5.5 0 0 0 .5.5"/>
            </svg>
          </button>
        {:else}
        <button class="absolute md:right-3 md:bottom-[1rem] right-2 bottom-[0.75rem] text-white font-bold rounded-full border-2 border-gray-900 p-1 dark:border-gray-200" on:click|preventDefault={stopChat}><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="h-2 w-2 text-gray-900 dark:text-gray-200" viewBox="0 0 16 16">
          <path d="M0 2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2z" stroke-width="0" />
        </svg></button>
        {/if}
      </div>
    </div>
  </div>
  {#if messages.length > 0}
    <button class="absolute z-10 text-gray-600 right-[46dvw] bottom-36 md:right-[40dvw] lg:right-[44.5dvw] md:bottom-28 {atBottom ? 'hidden' : 'block'} bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-600 hover:bg-blue-600 text-white font-bold py-2 px-2 rounded-full" on:click={goDown}>
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-chevron-bar-down text-black dark:text-white" viewBox="0 0 16 16">
        <path fill-rule="evenodd" d="M3.646 4.146a.5.5 0 0 1 .708 0L8 7.793l3.646-3.647a.5.5 0 0 1 .708.708l-4 4a.5.5 0 0 1-.708 0l-4-4a.5.5 0 0 1 0-.708zM1 11.5a.5.5 0 0 1 .5-.5h13a.5.5 0 0 1 0 1h-13a.5.5 0 0 1-.5-.5"/>
      </svg>
    </button>
  {/if}
</div>
</main>

<style lang="scss">
  @import 'https://unpkg.com/@highlightjs/cdn-assets/styles/github-dark.min.css';
</style>