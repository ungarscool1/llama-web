<script lang="ts">
  import { onMount } from 'svelte';
  import { env } from '$env/dynamic/public';
  import {
    Alert,
    Modal,
    Label,
  } from 'flowbite-svelte';

  export let id: string;
  export let modalShow: boolean = false
  export let mode: 'add' | 'edit' = 'add'
  let plugin;
  let pluginDefinition = '';
  let configuration: {[key: string]: string} = {};
  let error = '';
  let userInfo = {
    authenticated: false,
    token: null
  };
  $: onChange(id, modalShow);

  onMount(() => {
    if (localStorage.getItem('userInfo')) {
      userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    }
    if (mode === 'edit' && id && modalShow)
      getPlugin(id);
  });

  function onChange(...args) {
    if (modalShow && mode === 'edit' && id)
      getPlugin(id)
    if (modalShow == false) {
      pluginDefinition = '';
      configuration = {};
    }
  }

  async function getPlugin(id: string) {
    const req = await fetch(`${env.PUBLIC_API_URL}/plugins/${id}`, {
      headers: {
        Authorization: `Bearer ${userInfo.token}`
      }
    });
    plugin = await req.json();
    delete plugin.id;
    delete plugin.createdAt;
    delete plugin.updatedAt;
    delete plugin.__v;
    configuration = plugin.configuration;
    delete plugin.configuration;
    pluginDefinition = JSON.stringify(plugin, null, 2);
  }

  async function pluginAddEdit() {
    let jsonifiedPlugindefinition: object;
    if (pluginDefinition.length === 0) {
      error = 'Please enter a name';
      return;
    }
    try {
      jsonifiedPlugindefinition = JSON.parse(pluginDefinition);
    } catch (e) {
      error = 'the plugin definition is not valid.';
      return;
    }
    const req = await fetch(`${env.PUBLIC_API_URL}/plugins${mode === 'edit' ? `/${id}` : ''}`, {
      method: mode === 'add' ? 'POST' : 'PATCH',
      headers: {
        Authorization: `Bearer ${userInfo.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ ...jsonifiedPlugindefinition, configuration })
    });
    if (!req.ok) {
      error = (await req.json()).message;
      return;
    }
    pluginDefinition = '';
    configuration = {};
    modalShow = false;
  }
</script>

<Modal bind:open={modalShow} size="xl" autoclose={false} class="w-full">
  <div class="flex flex-col space-y-6">
    <h3 class="mb-4 text-xl font-medium text-gray-900 dark:text-white">{mode === 'add' ? 'Add' : 'Edit'} a new plugin</h3>
    {#if error.length > 0}
      <Alert color="red">
        <span class="font-medium">An error occured</span>
        {error}
      </Alert>
    {/if}
    <Label class="space-y-2">
      <span>Plugin definition</span>
      <textarea draggable="false" rows="20" class="block resize-none w-full disabled:cursor-not-allowed disabled:opacity-50 focus:border-blue-500 focus:ring-blue-500 dark:focus:border-blue-500 dark:focus:ring-blue-500 bg-gray-50 text-gray-900 dark:bg-gray-600 dark:text-white dark:placeholder-gray-400 border-gray-300 dark:border-gray-500 p-2.5 text-sm rounded-lg" placeholder="Plugin definition" bind:value={pluginDefinition}></textarea>
    </Label>
    <button
      type="submit"
      class="text-center font-medium focus:ring-4 focus:outline-none inline-flex items-center justify-center px-5 py-2.5 text-sm text-white bg-blue-700 hover:bg-blue-800 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800 rounded-lg w-full1"
      on:click|preventDefault={pluginAddEdit}>{mode === 'add' ? 'Add' : 'Edit'} the plugin</button
    >
  </div>
</Modal>