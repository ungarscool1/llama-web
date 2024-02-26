<script lang="ts">
  import { onMount } from 'svelte';
  import { env } from '$env/dynamic/public';
    import { Spinner } from 'flowbite-svelte';

  let prompts = {
    sendable: false,
    sending: false,
    incomingPrompt: '',
    outgoingPrompt: ''
  };
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
        prompts.incomingPrompt = res.prompt;
        prompts.outgoingPrompt = res.prompt;
      });
  }
  async function changeSystemPrompt() {
    if (prompts.outgoingPrompt === prompts.incomingPrompt) return;
    if (!prompts.outgoingPrompt || prompts.outgoingPrompt.length === 0) {
      prompts.outgoingPrompt = 'Below is an instruction that describes a task. Write a response that appropriately completes the request. The response must be accurate, concise and evidence-based whenever possible.';
    }
    prompts.sending = true;
    const req = await fetch(`${env.PUBLIC_API_URL}/settings/prompt`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${userInfo.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: prompts.outgoingPrompt
      })
    });
    if (req.status === 200) {
      prompts.incomingPrompt = prompts.outgoingPrompt;
      prompts.sendable = false;
    }
    prompts.sending = false;
  }
  
  const isSendable = () => prompts.sendable = prompts.incomingPrompt !== prompts.outgoingPrompt;
</script>

<div class="flex flex-col justify-between h-full">
  <textarea draggable="false" rows="10" class="block resize-none w-full focus:border-blue-500 focus:ring-blue-500 dark:focus:border-blue-500 dark:focus:ring-blue-500 bg-gray-50 text-gray-900 dark:bg-gray-600 dark:text-white dark:placeholder-gray-400 p-2.5 text-sm rounded-lg" placeholder="You are a helpful assistant." bind:value={prompts.outgoingPrompt} on:change={isSendable}></textarea>
  <div class="flex justify-end mt-4">
    <button class="text-white bg-blue-700 disabled:bg-blue-500 disabled:hover:bg-blue-600 hover:bg-blue-800 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none" on:click={changeSystemPrompt} disabled={!prompts.sendable}>
    {#if prompts.sending}
      <Spinner color='gray' />
    {:else}
      Save
    {/if}
  </div>
</div>