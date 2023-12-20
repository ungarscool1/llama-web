<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { env } from '$env/dynamic/public';
  import {
    Button,
  } from 'flowbite-svelte';
  import Edition from '../../../../components/plugins/edition.svelte';
  import Table from '../../../../components/plugins/table.svelte';

  $: plugins = [];
  $: reloadPlugins(showModal);
  let userInfo = {
    authenticated: false,
    token: null
  };
  let edition = false;
  let showModal = false;
  let pluginId = '';
  let modalMode: 'add' | 'edit' = 'add';

  onMount(() => {
    if (localStorage.getItem('userInfo')) {
      userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    }
    if (!userInfo.authenticated) {
      goto('/');
    } else {
      pingApi();
    }
    getPlugins();
  });
  
  function reloadPlugins(...args) {
      getPlugins();
  }

  async function pingApi() {
    const req = await fetch(`${env.PUBLIC_API_URL}/`, {
      headers: {
        Authorization: `Bearer ${userInfo.token}`
      }
    });
    if (!req.ok) return goto('/');
  }

  async function getPlugins() {
    const req = await fetch(`${env.PUBLIC_API_URL}/plugins`, {
      headers: {
        Authorization: `Bearer ${userInfo.token}`
      }
    });
    if (!req.ok) return goto('/');
    plugins = await req.json();
  }
</script>

<div class="flex flex-row justify-between p-6">
  <div>
    <h1 class="text-xl font-semibold text-gray-900 dark:text-white">Plugins</h1>
    {#if !edition}
      <p class="text-sm text-gray-500 dark:text-gray-400">Manage your plugins</p>
    {/if}
  </div>
  {#if !edition}
    <Button on:click={() => {showModal = true; modalMode = 'add'; pluginId = '';}}
      ><svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        fill="currentColor"
        class="bi bi-plus"
        viewBox="0 0 16 16"
      >
        <path
          d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"
        />
      </svg>&nbsp; Add a new plugin</Button
    >
  {/if}
</div>
{#if !edition}
<Table plugins={plugins} bind:edition={edition} bind:editionMode={modalMode} bind:pluginToEdit={pluginId} bind:userInfo={userInfo}></Table>
{:else}
<Edition bind:id={pluginId} bind:modalShow={showModal} bind:mode={modalMode}></Edition>
{/if}
