<script lang="ts">
  import { env } from '$env/dynamic/public';
  import { onMount } from 'svelte';
  import * as Dialog from "$lib/components/ui/dialog";
  import { Button } from "$lib/components/ui/button/index.js";
  import { Label } from "$lib/components/ui/label/index.js";
  import { Input } from "$lib/components/ui/input";
  import { Textarea } from "$lib/components/ui/textarea/index.js";
  import Alert from '$lib/components/playground/alert/alert.svelte';

  export let modalShow: boolean = false;
  let alternativeBackendSwitch = false;
  $: alternativeBackendAllowed = false;
  let modelDownload = false;
  let modalErrorMessage = '';
  let modelConfig = {
    name: '',
    uri: '',
    promptTemplate: '',
    parameters: {
      authentication: ''
    }
  };
  let userInfo = {
    authenticated: false,
    token: null
  };
  
  
  onMount(() => {
    if (localStorage.getItem('userInfo')) {
      userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
      checkAlternativeBackendOption();
    }
  });
  
  async function createModel() {
    if (modelConfig.name.length === 0) {
      modalErrorMessage = 'Please enter a name';
      return;
    }
    const req = await fetch(`${env.PUBLIC_API_URL}/models`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${userInfo.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: modelConfig.name,
        uri: modelConfig.uri,
        promptTemplate: modelConfig.promptTemplate,
        alternativeBackend: alternativeBackendSwitch,
        parameters: modelConfig.parameters
      })
    });
    if (!req.ok) {
      modalErrorMessage = (await req.json()).message;
      return;
    }
    modelConfig.name = '';
    modelConfig.uri = '';
    modelConfig.promptTemplate = '';
    modelDownload = true;
    modalErrorMessage = '';
    modalShow = false;
  }
  
  async function checkAlternativeBackendOption() {
    const req = await fetch(`${env.PUBLIC_API_URL}/system`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${userInfo.token}`,
        'Content-Type': 'application/json'
      }
    });
    if (!req.ok) {
      modalErrorMessage = (await req.json()).message;
      return;
    }
    const res = await req.json();
    alternativeBackendAllowed = res.options.allowAlternativeBackend;
  }
</script>

<Dialog.Root bind:open={modalShow} >
  <Dialog.Content class="md:max-w-[680px]">
    <Dialog.Header>
      <Dialog.Title>Add a new model</Dialog.Title>
      {#if alternativeBackendAllowed}
        <p class="text-sm text-gray-900 dark:text-white leading-normal font-normal text-left whitespace-normal mt-1" >Or use <button class="text-blue-500" on:click={(e) => {
          e.preventDefault();
          alternativeBackendSwitch = !alternativeBackendSwitch;
        }}>{alternativeBackendSwitch ? 'legacy' : 'alternative'} backend</button></p>
      {/if}
    </Dialog.Header>
    <div class="flex flex-col justify-between h-full space-y-2">
      {#if !alternativeBackendSwitch}
        <Label class="space-y-2">
          <span>Model name</span>
          <Input type="name" placeholder="Model name" bind:value={modelConfig.name} />
        </Label>
        <Label class="space-y-2">
          <span>Model download URI</span>
          <Input type="repository" placeholder="Model download URI" bind:value={modelConfig.uri} />
        </Label>
        <Label class="space-y-2">
          <span>Model prompt template</span>
          <Textarea placeholder="Model prompt template" bind:value={modelConfig.promptTemplate} rows=2 draggable="false" class="resize-none" />
        </Label>
        <div class="flex justify-end mt-4">
          <Button on:click={createModel}>
            Install the new model
          </Button>
        </div>
      {:else}
        <Alert errorMessage="Using another backend may not comply with your security policy." />
        <Label class="space-y-2">
          <span>Model name</span>
          <Input type="name" placeholder="Model name" bind:value={modelConfig.name} />
        </Label>
        <Label class="space-y-2">
          <span>Model API Endpoint</span>
          <Input type="repository" placeholder="Model API Endpoint" bind:value={modelConfig.uri} />
        </Label>
        <Label class="space-y-2">
          <span>Authentication</span>
          <Input type="authentication" placeholder="Model API Authentication" bind:value={modelConfig.parameters.authentication} />
        </Label>
        <div class="flex justify-end mt-4">
          <Button on:click={createModel}>
            Add the alternative backend model
          </Button>
        </div>
      {/if}
    </div>
  </Dialog.Content>
</Dialog.Root>
