<script lang="ts">
  import { onMount } from 'svelte';
  import { env } from '$env/dynamic/public';
  import {
    Alert,
    Modal,
    Label,
  } from 'flowbite-svelte';
  import CodeMirror from "svelte-codemirror-editor";
  import { json } from "@codemirror/lang-json";
  import { oneDark } from '@codemirror/theme-one-dark';
  import Pipeline from './pipeline.svelte';


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
  $: onDefinitionChange(pluginDefinition);

  onMount(() => {
    if (localStorage.getItem('userInfo')) {
      userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    }
    if (mode === 'edit' && id && modalShow)
      getPlugin(id);
  });

  function onChange(...args) {
    if (mode === 'edit' && id)
      getPlugin(id);
  }
  
  function onDefinitionChange(...args) {
    let def;
    if (pluginDefinition.length === 0) return;
    try {
      def = JSON.parse(pluginDefinition);
      error = '';
    } catch (e) {
      error = 'the plugin definition is not a valid JSON.';
    }
    if (def && def.parameters) {
      console.log(typeof configuration)
      for (const key of Object.keys(def.parameters)) {
        if (key === '') continue;
        if (!configuration[key]) {
          configuration[key] = def.parameters[key].default || '';
        }
      }
    }
  }

  async function getPlugin(id: string) {
    const req = await fetch(`${env.PUBLIC_API_URL}/plugins/${id}`, {
      headers: {
        Authorization: `Bearer ${userInfo.token}`
      }
    });
    plugin = await req.json();
    let pluginCopy = JSON.parse(JSON.stringify(plugin));
    delete pluginCopy.id;
    delete pluginCopy.createdAt;
    delete pluginCopy.updatedAt;
    delete pluginCopy.__v;
    configuration = plugin.configuration || {};
    delete pluginCopy.configuration;
    pluginDefinition = JSON.stringify(pluginCopy, null, 2);
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

<div class="hidden md:flex flex-row">
  {#if error.length > 0}
    <Alert color="red">
      <span class="font-medium">An error occured</span>
      {error}
    </Alert>
  {/if}
  <div class="w-[50dvw]">
    <CodeMirror bind:value={pluginDefinition} lang={json()} tabSize={2} theme={oneDark} styles={{
      "&": {
        "height": "40rem"
      }
    }}/>
  </div>
  <div class="w-[50dvw]">
    <Pipeline definition={pluginDefinition} />
  </div>
</div>
<div class="block md:hidden">
  <h2 class="text-xl font-semibold text-gray-900 dark:text-white">We are sorry but this page won't support phone size</h2>
</div>

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
    {#if configuration && Object.keys(configuration).length > 0}
      <Label class="space-y-2">
        <span>Configuration</span>
        {#each Object.keys(configuration) as key}
          <div class="flex flex-row space-x-2">
            <input type="text" class="block w-full disabled:cursor-not-allowed disabled:opacity-50 focus:border-blue-500 focus:ring-blue-500 dark:focus:border-blue-500 dark:focus:ring-blue-500 bg-gray-50 text-gray-900 dark:bg-gray-600 dark:text-white dark:placeholder-gray-400 border-gray-300 dark:border-gray-500 p-2.5 text-sm rounded-lg" placeholder="Key" value={key} disabled />
            <input type="text" class="block w-full disabled:cursor-not-allowed disabled:opacity-50 focus:border-blue-500 focus:ring-blue-500 dark:focus:border-blue-500 dark:focus:ring-blue-500 bg-gray-50 text-gray-900 dark:bg-gray-600 dark:text-white dark:placeholder-gray-400 border-gray-300 dark:border-gray-500 p-2.5 text-sm rounded-lg" placeholder="Value" value={configuration[key]} />
          </div>
        {/each}
      </Label>
    {:else}
      <Label class="space-y-2">
        <span>Configuration</span>
        <span class="text-gray-500 dark:text-gray-400">No configuration needed</span>
      </Label>
    {/if}
    <button
      type="submit"
      class="text-center font-medium focus:ring-4 focus:outline-none inline-flex items-center justify-center px-5 py-2.5 text-sm text-white bg-blue-700 hover:bg-blue-800 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800 rounded-lg w-full1"
      on:click|preventDefault={pluginAddEdit}>{mode === 'add' ? 'Add' : 'Edit'} the plugin</button
    >
  </div>
</Modal>