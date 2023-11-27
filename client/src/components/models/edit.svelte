<script lang="ts">
  import { onMount } from 'svelte';
  import { env } from '$env/dynamic/public';
  import {
    Alert,
    Modal,
    Label,
    P,
  } from 'flowbite-svelte';

  export let id: string
  export let modalShow: boolean = false
  let model: {id: string, promptTemplate: string}
  let error = '';
  let userInfo = {
    authenticated: false,
    token: null
  };

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
        Authorization: `Bearer ${userInfo.token}`
      },
      body: JSON.stringify(model)
    });
    if (!req.ok) {
      let res = await req.json()
      error = res.message
      return
    }
    modalShow = false
  }
</script>

<Modal bind:open={modalShow} size="xs" autoclose={false} class="w-full">
  <div class="flex flex-col space-y-6">
    <h3 class="mb-4 text-xl font-medium text-gray-900 dark:text-white">Edit the model</h3>
      {#if error.length > 0}
        <Alert color="red">
          <span class="font-medium">An error occured</span>
          {error}
        </Alert>
      {/if}
      <Label class="space-y-2">
        <span>Model prompt template</span>
        <textarea draggable="false" rows="2" class="block resize-none w-full disabled:cursor-not-allowed disabled:opacity-50 focus:border-blue-500 focus:ring-blue-500 dark:focus:border-blue-500 dark:focus:ring-blue-500 bg-gray-50 text-gray-900 dark:bg-gray-600 dark:text-white dark:placeholder-gray-400 border-gray-300 dark:border-gray-500 p-2.5 text-sm rounded-lg" placeholder="Model prompt template" bind:value={model.promptTemplate}></textarea>
      </Label>
      <button
        type="submit"
        class="text-center font-medium focus:ring-4 focus:outline-none inline-flex items-center justify-center px-5 py-2.5 text-sm text-white bg-blue-700 hover:bg-blue-800 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800 rounded-lg w-full1"
        on:click|preventDefault={updateModel}>Update the model</button
      >
  </div>
</Modal>