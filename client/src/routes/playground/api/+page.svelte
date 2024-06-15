<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { env } from '$env/dynamic/public';
  import * as Table from "$lib/components/ui/table";
  import { Icon } from '$lib/components/ui/icon';
  import * as Dialog from "$lib/components/ui/dialog";
  import { Button } from "$lib/components/ui/button/index.js";
  import { Input } from "$lib/components/ui/input";
  import Alert from '$lib/components/playground/alert/alert.svelte';
  import {
    Label
  } from 'flowbite-svelte';

  $: apiKeys = [];
  let userInfo = {
    authenticated: false,
    token: null
  };
  let modalOpen = false;
  let modalKeyName = '';
  let modalKey = '';
  let modalError = false;

  onMount(() => {
    if (localStorage.getItem('userInfo')) {
      userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    }
    if (!userInfo.authenticated) {
      goto('/');
    } else {
      pingApi();
    }
    getKeys();
  });

  async function pingApi() {
    const req = await fetch(`${env.PUBLIC_API_URL}/`, {
      headers: {
        Authorization: `Bearer ${userInfo.token}`
      }
    });
    if (!req.ok) return goto('/');
  }

  async function getKeys() {
    const req = await fetch(`${env.PUBLIC_API_URL}/settings/api`, {
      headers: {
        Authorization: `Bearer ${userInfo.token}`
      }
    });
    if (!req.ok) return goto('/');
    apiKeys = await req.json();
  }

  async function deleteKey(id: string) {
    const req = await fetch(`${env.PUBLIC_API_URL}/settings/api/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${userInfo.token}`
      }
    });
    if (!req.ok) return goto('/');
    getKeys();
  }

  async function createKey() {
    if (modalKeyName.length === 0) return (modalError = true);
    const req = await fetch(`${env.PUBLIC_API_URL}/settings/api`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${userInfo.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name: modalKeyName })
    });
    if (!req.ok) return goto('/');
    modalKeyName = '';
    modalKey = (await req.json()).token;
    getKeys();
  }
</script>

<div class="flex flex-row justify-between p-6">
  <div>
    <h1 class="text-xl font-semibold text-gray-900 dark:text-white">API Keys</h1>
    <p class="text-sm text-gray-500 dark:text-gray-400">Manage your API keys</p>
  </div>
  <Button on:click={() => (modalOpen = true)}
    ><Icon name="plus" class="pr-2" /> Add new key</Button
  >
</div>
<div class="p-6">
  <Table.Root>
    <Table.Caption class={apiKeys.length === 0 ? '' : 'hidden'}>An empty list of your API keys.</Table.Caption>
    <Table.Header>
      <Table.Row>
        <Table.Head class="w-[100px]">Key name</Table.Head>
        <Table.Head>Key</Table.Head>
        <Table.Head>Created at</Table.Head>
        <Table.Head>Last used at</Table.Head>
        <Table.Head>
          <span class="sr-only"> Edit </span>
        </Table.Head>
      </Table.Row>
    </Table.Header>
    <Table.Body>
      {#each apiKeys as key}
        <Table.Row>
          <Table.Cell>{key.name}</Table.Cell>
          <Table.Cell>{key.token}</Table.Cell>
          <Table.Cell>{new Date(key.createdAt).toLocaleString()}</Table.Cell>
          <Table.Cell>{new Date(key.lastUsed).toLocaleString()}</Table.Cell>
          <Table.Cell><button
            class="flex btn btn-ghost btn-sm"
            on:click|preventDefault={() => {
              deleteKey(key.id);
            }}
          >
            <Icon name="trash-2" class="size-4" />
          </button></Table.Cell>
        </Table.Row>
      {/each}
    </Table.Body>
  </Table.Root>
</div>

<Dialog.Root bind:open={modalOpen} >
  <Dialog.Content class="md:max-w-[680px]">
    <Dialog.Header>
      <Dialog.Title>Create new API key</Dialog.Title>
    </Dialog.Header>
    <div class="flex flex-col justify-between h-full">
      {#if modalKey.length === 0}
        {#if modalError}
          <Alert errorMessage='The API Key name is required.' />
        {/if}
        <Label class="space-y-2">
          <span>Key name</span>
          <Input name="name" placeholder="My key name" required bind:value={modalKeyName} />
        </Label>
        <div class="flex justify-end mt-4">
          <Button on:click={createKey}>
            Create
          </Button>
        </div>
      {:else}
        <Label class="space-y-2">
          <span>Key</span>
          <Input disabled required bind:value={modalKey} />
        </Label>
        
        <div class="flex justify-end mt-4">
          <Button on:click={() => {
            modalOpen = false;
            modalKey = '';
          }}>
            Close
          </Button>
        </div>
      {/if}
    </div>
  </Dialog.Content>
</Dialog.Root>
