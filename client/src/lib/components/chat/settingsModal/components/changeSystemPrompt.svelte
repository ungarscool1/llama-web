<script lang="ts">
  import { onMount } from 'svelte';
  import { env } from '$env/dynamic/public';
  import { Button } from "$lib/components/ui/button/index.js";
  import { Textarea } from "$lib/components/ui/textarea/index.js";
  import LoaderCircle from "lucide-svelte/icons/loader-circle";

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
  $: onChange(prompts.outgoingPrompt);

  onMount(() => {
    if (localStorage.getItem('userInfo')) {
      userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
      loadSystemPrompt();
    }
  });
  async function onChange(...args) {
    isSendable();
  }

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
  <Textarea draggable="false" class="resize-none" placeholder="You are a helpful assistant." bind:value={prompts.outgoingPrompt} rows="10" />
  <div class="flex justify-end mt-4">
    <Button on:click={changeSystemPrompt} disabled={!prompts.sendable}>
      {#if prompts.sending}
        <LoaderCircle class="size-5 animate-spin" />
      {:else}
        Save
      {/if}
    </Button>
  </div>
</div>