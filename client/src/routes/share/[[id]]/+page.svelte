<svelte:head>
  <script>
    // took from flowbite-svelte
    if ('color-theme' in localStorage) {
      // explicit preference - overrides author's choice
      localStorage.getItem('color-theme') === 'dark' ? window.document.documentElement.classList.add('dark') : window.document.documentElement.classList.remove('dark');
    } else {
      // browser preference - does not overrides
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) window.document.documentElement.classList.add('dark');
    }
  </script>
</svelte:head>
<script lang="ts">
  import { Spinner } from 'flowbite-svelte';
  import { env } from '$env/dynamic/public';
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import Message from '$lib/components/chat/message/message.svelte';

  let id = $page.params.id;
  let error = false;
  let userInfo = {
    authenticated: false,
    token: null
  };
  let chat: {
    id: string,
    messages: {role: string, message: string}[],
    model: string,
    visibility: string
  };
  
  onMount(() => {
    if (localStorage.getItem('userInfo')) {
      userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    }
    if (!id) {
      error = true;
      return;
    }
    fetchChat();
  });
  
  async function fetchChat() {
    const req = await fetch(`${env.PUBLIC_API_URL}/shared/${id}`, {
      headers: {
        Authorization: `Bearer ${userInfo.token}`
      }
    });
    if (!req.ok) {
      error = true;
      return;
    }
    chat = await req.json();
  }
</script>
<main class="h-[100dvh] w-screen overflow-hidden relative z-0 md:flex">
  {#if error}
    <div class="flex items-center justify-center h-full w-full dark:text-white divide-x dark:divide-white">
      <h1 class="text-3xl font-bold pr-2">404</h1>
      <p class="text-xl pl-2 ">Chat not found</p>
    </div>
  {:else}
    {#if chat}
      <div class="flex flex-col h-full w-full">
        <div class="mx-auto w-full p-4 md:max-w-2xl md:px-0 lg:max-w-[38rem] xl:max-w-3xl">
          <div class="border-b border-gray-100 pb-4 pt-3 sm:mb-2 sm:pb-6 sm:pt-8">
            <h1 class="text-3xl font-semibold leading-tight text-gray-700 dark:text-gray-100 sm:text-4xl">
              {chat.messages[0].message.substring(0, 20)}
            </h1>
          </div>
        </div>
        <div class="flex flex-col h-full overflow-y-auto mx-auto w-full p-4 md:max-w-2xl md:px-0 lg:max-w-[38rem] xl:max-w-3xl">
          {#each chat.messages as msg}
            <Message username="Anonymous" message={msg} />
          {/each}
        </div>
      </div>
    {:else}
      <div class="flex flex-col h-full w-full">
        <div class="mx-auto w-full p-4 md:max-w-2xl md:px-0 lg:max-w-[38rem] xl:max-w-3xl">
          <div class="border-b border-gray-100 pb-4 pt-3 sm:mb-2 sm:pb-6 sm:pt-8">
            <h1 class="text-3xl font-semibold leading-tight text-gray-700 dark:text-gray-100 sm:text-4xl">
              <Spinner />
            </h1>
          </div>
        </div>
      </div>
    {/if}
  {/if}
</main>

<style>
  @import 'https://unpkg.com/@highlightjs/cdn-assets/styles/github-dark.min.css';
</style>
