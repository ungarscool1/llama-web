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
  };

  onMount(() => {
    if (localStorage.getItem('userInfo')) {
      userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    }
    if (!userInfo.authenticated) {
      localStorage.setItem('previousPage', $page.url.pathname);
      goto('/');
    }
    fetchChats();
    fetchMessage();
    pingApi();
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


<main class="h-screen w-screen overflow-y-none" on:keydown={handleKeyDown}>
<Sidebar {chats} />
<div id="content" class="p-4 md:ml-64 flex flex-col justify-between w-100 mx-auto overflow-y-none">
  <div id="chat-messages" class="overflow-y-auto md:px-10 mb-1 h-[calc(100vh-12rem)] md:h-[calc(100vh-6rem)]" bind:this={chatBox}>
    {#if messages.length > 0}
      {#each messages as message}
        <Message {message} />
      {/each}
    {:else}
      <Welcome bind:model={model} />
    {/if}
  </div>
  <div class="flex justify-center items-center">
    <div class="w-full mx-5">
      <div class="flex">
        <textarea disabled={isRequesting} draggable="false" rows="2" class="m-0 w-full resize-none border-1 border-solid rounded-l-md p-2 bg-transparent focus:ring-0 focus-visible:ring-0 dark:bg-transparent dark:text-white {isPromptError ? 'border-red-700' : ''}" style="max-height: 200px;" placeholder="Enter some text..." bind:value={prompt}></textarea>
        {#if !isRequesting}
          <button class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-r-md" on:click|preventDefault={sendRequest}>{!isError ? 'Send' : 'Regenerate'}</button>
        {:else}
          <button class="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-r-md" on:click|preventDefault={stopChat}>Stop</button>
        {/if}
      </div>
    </div>
  </div>
</div>
</main>

<style lang="scss">
  @import 'https://unpkg.com/@highlightjs/cdn-assets/styles/github-dark.min.css';
</style>