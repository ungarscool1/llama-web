<script lang="ts">
  import { env } from '$env/dynamic/public';
  import { onMount } from 'svelte';
  import { Alert, Button } from 'flowbite-svelte';

  $: prompt = '';
  $: isRequesting = false;
  $: errorMessage = '';
  $: embedResponse = '';
  $: model = ''
  $: models = [];
  let userInfo = {
    authenticated: false,
    token: null
  };

  onMount(() => {
    if (localStorage.getItem('userInfo')) {
      userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
      getModels();
    }
  });
  
  async function getModels() {
    const req = await fetch(`${env.PUBLIC_API_URL}/models`, {
      headers: {
        Authorization: `Bearer ${userInfo.token}`
      }
    });
    
    if (!req.ok) return goto('/');
    models = await req.json();
  }

  async function generateEmbeddings() {
    if (prompt.length === 0) {
      errorMessage = 'Please enter a prompt';
      return;
    } else if (prompt.length > 128) {
      errorMessage = 'Prompt is too long. Max length is 128 characters';
      return;
    } else if (model.length === 0) {
      errorMessage = 'Please select a model';
      return;
    } else {
      errorMessage = '';
    }
    isRequesting = true;
    const res = await fetch(`${env.PUBLIC_API_URL}/embeddings`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${userInfo.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ prompt, model })
    });
    if (res.ok) {
      const jsonRes: Array<number> = await res.json();
      embedResponse = jsonRes.join('\n');
    } else {
      errorMessage = await res.text();
    }
    isRequesting = false;
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
<div class="flex space-x-4 flex-col lg:flex-row">
  <div class="flex-1">
    <textarea
      placeholder="Few words to embed"
      rows="1"
      maxlength="128"
      class="w-full rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:placeholder-gray-400 dark:text-white border border-gray-200 dark:border-gray-600 resize-none p-2.5 text-sm focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-500 dark:focus:border-blue-500"
      bind:value={prompt}
    />
    <span class="text-base text-gray-900 dark:text-white">Output:</span>
    <textarea
      rows="20"
      maxlength="128"
      class="w-full rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:placeholder-gray-400 dark:text-white border border-gray-200 dark:border-gray-600 resize-none p-2.5 text-sm"
      bind:value={embedResponse}
      disabled
    />
  </div>
  <div class="w-[25%]">
    <div class="space-y-2 mb-4">
      <h3 class="text-xl font-medium text-gray-900 dark:text-white">Parameters</h3>
      <div>
        <p class="text-gray-500">Model</p>
        <select
          class="w-full rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:placeholder-gray-400 dark:text-white border border-gray-200 dark:border-gray-600 resize-none p-2.5 text-sm focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-500 dark:focus:border-blue-500"
          bind:value={model}
        >
          <option disabled selected value="">Select a model</option>
          {#each models as model}
            <option selected value={model.id}>{model.name}</option>
          {/each}
        </select>
      </div>
    </div>
    <div class="flex flex-col space-y-2">
      <h3 class="text-xl font-medium text-gray-900 dark:text-white">Launch</h3>
      <Button on:click={generateEmbeddings} disabled={isRequesting}>
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
