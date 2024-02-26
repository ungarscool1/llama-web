<script lang="ts">
  import { onMount } from 'svelte';
  import { env } from '$env/dynamic/public';

  let systemPrompt = '';
  let userInfo = {
    authenticated: false,
    token: null
  };

  onMount(() => {
    if (localStorage.getItem('userInfo')) {
      userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
      loadSystemPrompt();
    }
  });

  function loadSystemPrompt() {
    fetch(`${env.PUBLIC_API_URL}/settings/prompt`, {
      headers: {
        Authorization: `Bearer ${userInfo.token}`
      }
    })
      .then((res) => res.json())
      .then((res) => {
        systemPrompt = res.prompt;
      });
  }
  async function changeSystemPrompt() {
    if (!systemPrompt || systemPrompt.length === 0) {
      systemPrompt = 'Below is an instruction that describes a task. Write a response that appropriately completes the request. The response must be accurate, concise and evidence-based whenever possible.';
    }
    const req = await fetch(`${env.PUBLIC_API_URL}/settings/prompt`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${userInfo.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: systemPrompt
      })
    });
  }
</script>

<div class="flex flex-col justify-between h-full">
  <textarea draggable="false" rows="10" class="block resize-none w-full focus:border-blue-500 focus:ring-blue-500 dark:focus:border-blue-500 dark:focus:ring-blue-500 bg-gray-50 text-gray-900 dark:bg-gray-600 dark:text-white dark:placeholder-gray-400 p-2.5 text-sm rounded-lg" placeholder="You are a helpful assistant." bind:value={systemPrompt}></textarea>
  <div class="flex justify-end mt-4">
    <button class="text-white bg-blue-700 hover:bg-blue-800 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none" on:click={changeSystemPrompt}>Save</button>
  </div>
</div>