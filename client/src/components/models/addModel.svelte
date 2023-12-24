<script lang="ts">
  import { env } from '$env/dynamic/public';
  import { onMount } from 'svelte';
  import {
    Alert,
    Label,
    Modal,
    P
  } from 'flowbite-svelte';

  export let modalShow: boolean = false;
  let alternativeBackendSwitch = false;
  $: alternativeBackendAllowed = false;
  let modalModelName = '';
  let modalModelUri = '';
  let modalModelPromptTemplate = '';
  let modelDownload = false;
  let modalErrorMessage = '';
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
    if (modalModelName.length === 0) {
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
        name: modalModelName,
        uri: modalModelUri,
        promptTemplate: modalModelPromptTemplate,
        alternativeBackend: alternativeBackendSwitch
      })
    });
    if (!req.ok) {
      modalErrorMessage = (await req.json()).message;
      return;
    }
    modalModelName = '';
    modalModelUri = '';
    modalModelPromptTemplate = '';
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

<Modal bind:open={modalShow} size="xs" autoclose={false} class="w-full">
  <div class="flex flex-col space-y-6">
    <div>
      <h3 class="text-xl font-medium text-gray-900 dark:text-white">Add a new model</h3>
      {#if alternativeBackendAllowed}
        <P size="sm" >Or use <button on:click={(e) => {
          e.preventDefault();
          alternativeBackendSwitch = !alternativeBackendSwitch;
        }}>{alternativeBackendSwitch ? 'legacy' : 'alternative'} backend</button></P>
      {/if}
    </div>
    {#if modalErrorMessage.length > 0}
      <Alert color="red">
        <span class="font-medium">An error occured</span>
        {modalErrorMessage}
      </Alert>
    {/if}
    {#if !alternativeBackendSwitch}
      {#if !modelDownload}
        <Label class="space-y-2">
          <span>Model name</span>
          <input
            name="name"
            placeholder="Model name"
            required
            bind:value={modalModelName}
            class="block w-full disabled:cursor-not-allowed disabled:opacity-50 focus:border-blue-500 focus:ring-blue-500 dark:focus:border-blue-500 dark:focus:ring-blue-500 bg-gray-50 text-gray-900 dark:bg-gray-600 dark:text-white dark:placeholder-gray-400 border-gray-300 dark:border-gray-500 p-2.5 text-sm rounded-lg"
            type="text"
          />
        </Label>
        <Label class="space-y-2">
          <span>Model download URI</span>
          <input
            name="repository"
            placeholder="Model download URI"
            required
            bind:value={modalModelUri}
            class="block w-full disabled:cursor-not-allowed disabled:opacity-50 focus:border-blue-500 focus:ring-blue-500 dark:focus:border-blue-500 dark:focus:ring-blue-500 bg-gray-50 text-gray-900 dark:bg-gray-600 dark:text-white dark:placeholder-gray-400 border-gray-300 dark:border-gray-500 p-2.5 text-sm rounded-lg"
            type="text"
          />
        </Label>
        <Label class="space-y-2">
          <span>Model prompt template</span>
          <textarea draggable="false" rows="2" class="block resize-none w-full disabled:cursor-not-allowed disabled:opacity-50 focus:border-blue-500 focus:ring-blue-500 dark:focus:border-blue-500 dark:focus:ring-blue-500 bg-gray-50 text-gray-900 dark:bg-gray-600 dark:text-white dark:placeholder-gray-400 border-gray-300 dark:border-gray-500 p-2.5 text-sm rounded-lg" placeholder="Model prompt template" bind:value={modalModelPromptTemplate}></textarea>
        </Label>
        <button
          type="submit"
          class="text-center font-medium focus:ring-4 focus:outline-none inline-flex items-center justify-center px-5 py-2.5 text-sm text-white bg-blue-700 hover:bg-blue-800 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800 rounded-lg w-full1"
          on:click|preventDefault={createModel}>Install the new model</button
        >
      {:else}
        <P size="base">Please wait while the model is being downloaded and installed.</P>
        <P size="base">The model will appear in the list after the download complete.</P>
      {/if}
    {:else}
      <Alert color="red">
        <span class="font-medium">⚠ WARNING</span>
        Using another backend may not comply with your security policy.
      </Alert>
      <Label class="space-y-2">
        <span>Model name</span>
        <input
          name="name"
          placeholder="Model name"
          required
          bind:value={modalModelName}
          class="block w-full disabled:cursor-not-allowed disabled:opacity-50 focus:border-blue-500 focus:ring-blue-500 dark:focus:border-blue-500 dark:focus:ring-blue-500 bg-gray-50 text-gray-900 dark:bg-gray-600 dark:text-white dark:placeholder-gray-400 border-gray-300 dark:border-gray-500 p-2.5 text-sm rounded-lg"
          type="text"
        />
      </Label>
      <Label class="space-y-2">
        <span>Model API Endpoint</span>
        <input
          name="name"
          placeholder="Model API Endpoint"
          required
          bind:value={modalModelUri}
          class="block w-full disabled:cursor-not-allowed disabled:opacity-50 focus:border-blue-500 focus:ring-blue-500 dark:focus:border-blue-500 dark:focus:ring-blue-500 bg-gray-50 text-gray-900 dark:bg-gray-600 dark:text-white dark:placeholder-gray-400 border-gray-300 dark:border-gray-500 p-2.5 text-sm rounded-lg"
          type="text"
        />
      </Label>
      <button
        type="submit"
        class="text-center font-medium focus:ring-4 focus:outline-none inline-flex items-center justify-center px-5 py-2.5 text-sm text-white bg-blue-700 hover:bg-blue-800 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800 rounded-lg w-full1"
        on:click|preventDefault={createModel}>Add the alternative backend model</button
      >
    {/if}
  </div>
</Modal>