<script lang="ts">
  import { env } from '$env/dynamic/public';
  import { onMount } from 'svelte';
  import { Alert, Button } from 'flowbite-svelte';

  $: system = '';
  $: messages = [
    {
      role: 'user',
      message: ''
    }
  ];
  $: isRequesting = false;
  $: errorMessage = '';
  $: model = ''
  $: models = [];
  $: isModelAlternativeBackend = false;
  let userInfo = {
    authenticated: false,
    token: null
  };
  $: onModelChange(model);

  onMount(() => {
    if (localStorage.getItem('userInfo')) {
      userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
      getModels();
    }
  });
  
  function onModelChange(...args) {
    isModelAlternativeBackend = models.find((model) => model.name === args[0])?.alternativeBackend || false;
  }
  
  async function getModels() {
    const req = await fetch(`${env.PUBLIC_API_URL}/models`, {
      headers: {
        Authorization: `Bearer ${userInfo.token}`
      }
    });
    
    if (!req.ok) return goto('/');
    models = await req.json();
    model = models[0].name;
  }

  const switchPrompter = (i: number) =>
    (messages[i].role = messages[i].role === 'user' ? 'assistant' : 'user');

  function addMessage() {
    const nextRole = () => {
      if (messages.length === 0) {
        return 'user';
      }
      return messages[messages.length - 1].role === 'user' ? 'assistant' : 'user';
    };
    messages = [
      ...messages,
      {
        role: nextRole(),
        message: ''
      }
    ];
  }
  
  async function chatResponse() {
    if (system.length === 0 && messages.length === 1 && messages[0].message.length > 1)
      system = 'You are a helpful assistant.';
    isRequesting = true;
    errorMessage = '';
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${env.PUBLIC_API_URL}/custom-chat`);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('Authorization', `Bearer ${userInfo.token}`);
    xhr.send(JSON.stringify({ system, messages, model }));
    messages = [
      ...messages,
      {
        role: 'assistant',
        message: ''
      }
    ];
    xhr.addEventListener('progress', (event) => {
      const resText = xhr.responseText.trim();
      messages[messages.length - 1].message = resText;
    });
    xhr.onloadend = () => {
      isRequesting = false;
    };
  }
</script>

{#if errorMessage.length > 0}
  <div class="mb-4">
    <Alert color="red">
      <span slot="icon"
        ><svg
          aria-hidden="true"
          class="w-5 h-5"
          fill="currentColor"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
          ><path
            fill-rule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
            clip-rule="evenodd"
          /></svg
        >
      </span>
      {errorMessage}
    </Alert>
  </div>
{/if}
<div class="flex flex-col space-x-3 lg:flex-row w-full">
  <div class="flex w-[75%] space-x-3 space-y-3 flex-col lg:flex-row">
    <div class="flex w-full lg:w-[35%] flex-col">
      <h3 class="dark:text-white">System</h3>
      {#if isModelAlternativeBackend}
        <p class="text-gray-500">Alternative model does not support custom system prompt</p>
      {:else}
        <textarea
          placeholder="You are a helpful assistant."
          class="h-[100%] rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:placeholder-gray-400 dark:text-white border border-gray-200 dark:border-gray-600 resize-none p-2.5 text-sm focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-500 dark:focus:border-blue-500"
          bind:value={system}
        />
      {/if}
    </div>
    <div class="flex w-[65%] flex-col space-y-3">
      {#each messages as message, i}
        <div class="flex w-full flex-row">
          <div class="basis-1/4">
            <button
              type="button"
              class="text-center font-medium inline-flex items-center justify-center px-5 py-2.5 text-sm text-gray-900 bg-white border border-gray-300 hover:bg-gray-100 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-600 rounded-lg"
              on:click={() => {
                switchPrompter(i);
              }}>{message.role.charAt(0).toUpperCase() + message.role.slice(1)}</button
            >
          </div>
          <div class="basis-1/2">
            <input
              class="block lg:w-full focus:border-blue-500 focus:ring-blue-500 dark:focus:border-blue-500 dark:focus:ring-blue-500 bg-gray-50 text-gray-900 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 border-gray-300 dark:border-gray-600 p-2.5 text-sm rounded-lg"
              type="text"
              bind:value={message.message}
              placeholder="Enter a {message.role} message."
            />
          </div>
          <div class="basis-1/4 flex justify-center items-center">
            <button
              type="button"
              class="text-center font-medium inline-flex px-5 py-2.5 text-sm text-gray-400 hover:text-gray-900 dark:text-gray-500 dark:hover:text-gray-100 dark:border-gray-600 rounded-lg"
              on:click={() => {
                messages = messages.filter((_, index) => index !== i);
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                fill="currentColor"
                class="bi bi-x-circle"
                viewBox="0 0 16 16"
              >
                <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
                <path
                  d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"
                />
              </svg>
            </button>
          </div>
        </div>
      {/each}
      <button on:click={addMessage}
      class="text-center font-medium inline-flex items-center justify-start px-5 py-2.5 text-sm text-gray-900 bg-white border border-gray-300 hover:bg-gray-100 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-600 rounded-lg"
        ><svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          fill="currentColor"
          class="bi bi-plus-circle"
          viewBox="0 0 16 16"
        >
          <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
          <path
            d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"
          />
      </svg>&nbsp; Add message</button
      >
    </div>
  </div>
  <div class="flex-1 flex-col">
    <div class="space-y-2 mb-4">
      <h3 class="text-xl font-medium text-gray-900 dark:text-white">Parameters</h3>
      <div>
        <p class="text-gray-500">Model</p>
        <select
          class="w-full rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:placeholder-gray-400 dark:text-white border border-gray-200 dark:border-gray-600 resize-none p-2.5 text-sm focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-500 dark:focus:border-blue-500"
          bind:value={model}
        >
          {#each models as model}
            <option value={model.name}>{model.name}</option>
          {/each}
        </select>
      </div>
    </div>
    <div class="flex flex-col space-y-2">
      <h3 class="text-xl font-medium text-gray-900 dark:text-white">Launch</h3>
      <Button on:click={chatResponse} disabled={isRequesting}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          fill="currentColor"
          class="bi bi-lightning-charge"
          viewBox="0 0 16 16"
        >
          <path
            d="M11.251.068a.5.5 0 0 1 .227.58L9.677 6.5H13a.5.5 0 0 1 .364.843l-8 8.5a.5.5 0 0 1-.842-.49L6.323 9.5H3a.5.5 0 0 1-.364-.843l8-8.5a.5.5 0 0 1 .615-.09zM4.157 8.5H7a.5.5 0 0 1 .478.647L6.11 13.59l5.732-6.09H9a.5.5 0 0 1-.478-.647L9.89 2.41 4.157 8.5z"
          />
        </svg>&nbsp; Generate
      </Button>
    </div>
  </div>
</div>
