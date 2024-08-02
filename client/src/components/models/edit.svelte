<script lang="ts">
  import { onMount } from 'svelte';
  import { env } from '$env/dynamic/public';
  import * as Dialog from "$lib/components/ui/dialog";
  import { Button } from "$lib/components/ui/button/index.js";
  import { Label } from "$lib/components/ui/label/index.js";
  import { Input } from "$lib/components/ui/input";
  import { Textarea } from "$lib/components/ui/textarea/index.js";

  export let id: string
  export let modalShow: boolean = false
  let model: {
    id: string,
    promptTemplate: string,
    alternativeBackend: boolean,
    parameters: Record<string, any>
  }
  let error = '';
  let userInfo = {
    authenticated: false,
    token: null
  };
  $: onChange(id);

  onMount(() => {
    if (localStorage.getItem('userInfo')) {
      userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    }
    getModel(id);
  });

  function onChange(...args) {
    if (modalShow)
      getModel(id)
  }

  async function getModel(id: string) {
    const req = await fetch(`${env.PUBLIC_API_URL}/models/${id}`, {
      headers: {
        Authorization: `Bearer ${userInfo.token}`
      }
    });
    model = await req.json();
  }

  async function updateModel() {
    const req = await fetch(`${env.PUBLIC_API_URL}/models/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userInfo.token}`
      },
      body: JSON.stringify({
        promptTemplate: model.promptTemplate,
        parameters: model.parameters
      })
    });
    if (!req.ok) {
      let res = await req.json()
      error = res.message
      return
    }
    modalShow = false
  }
</script>

<Dialog.Root bind:open={modalShow} >
  <Dialog.Content class="md:max-w-[680px]">
    <Dialog.Header>
      <Dialog.Title>Edit the model</Dialog.Title>
    </Dialog.Header>
    <div class="flex flex-col justify-between h-full space-y-2">
      {#if !model.alternativeBackend}
        <Label class="space-y-2">
          <span>Model prompt template</span>
          <Textarea placeholder="Model prompt template" bind:value={model.promptTemplate} rows=2 draggable="false" class="resize-none" />
        </Label>
      {:else}
        <Label class="space-y-2">
          <span>Authentication</span>
          <Input placeholder="Authentication" bind:value={model.parameters.authentication} />
        </Label>
      {/if}
      <div class="flex justify-end mt-4">
        <Button on:click={updateModel}>
          Update the model
        </Button>
      </div>
    </div>
  </Dialog.Content>
</Dialog.Root>