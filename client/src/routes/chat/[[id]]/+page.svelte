<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { env } from '$env/dynamic/public';
  import Sidebar from '../../../components/chat/sidebar.svelte';
    import Message from '../../../components/chat/message.svelte';

  $: activeUrl = $page.url.pathname;
  $: chats = undefined;
  $: messages = [];
  $: onChange(activeUrl);
  $: prompt = "";
  let isRequesting = false;
  let isPromptError = false;
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
    xhr.send(JSON.stringify({ message: prompt, id }));
    isRequesting = true;
    prompt = "";
    messages = [...messages, {
      message: 'Waiting for response...',
      isBot: true
    }];
    chatBox.scroll({ top: chatBox.scrollHeight, behavior: 'smooth' });
    xhr.addEventListener('progress', (event) => {
      let id: string | undefined;
      messages[messages.length - 1].message = xhr.responseText;
      if ((id = xhr.responseText.match(/\[\[(\w{24})\]\]/)?.[1]) !== undefined) {
        goto(`/chat/${id}`);
      }
    });
    
    xhr.onloadend = () => {
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


<main class="h-full w-screen overflow-y-none" on:keydown={handleKeyDown}>
<Sidebar {chats} />
<div id="content" class="p-4 sm:ml-64 flex mt-2 flex-col justify-between w-100 mx-auto overflow-y-none">
  <div id="chat-messages" class="overflow-y-auto px-10 mb-6 h-[calc(100vh-9rem)]" bind:this={chatBox}>
    {#if messages}
      {#each messages as message}
        <Message {message} />
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

<style lang="scss">
  @import 'https://unpkg.com/@highlightjs/cdn-assets@10.6.0/styles/night-owl.min.css';
</style>