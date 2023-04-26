<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { env } from '$env/dynamic/public';
  import {
    Table,
    TableBody,
    TableBodyCell,
    TableBodyRow,
    TableHead,
    TableHeadCell,
    Button,
    Modal,
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
    </svg>&nbsp; Add new key</Button
  >
</div>
<div>
  <Table>
    <caption
      class="p-5 text-lg font-semibold text-left text-gray-900 bg-white dark:text-white dark:bg-gray-800"
    />
    <TableHead>
      <TableHeadCell>Key name</TableHeadCell>
      <TableHeadCell>Key</TableHeadCell>
      <TableHeadCell>Created at</TableHeadCell>
      <TableHeadCell>Last used at</TableHeadCell>
      <TableHeadCell>
        <span class="sr-only"> Edit </span>
      </TableHeadCell>
    </TableHead>
    <TableBody tableBodyClass="divide-y">
      {#each apiKeys as key}
        <TableBodyRow>
          <TableBodyCell>{key.name}</TableBodyCell>
          <TableBodyCell>{key.token}</TableBodyCell>
          <TableBodyCell>{new Date(key.createdAt).toLocaleString()}</TableBodyCell>
          <TableBodyCell>{new Date(key.lastUsed).toLocaleString()}</TableBodyCell>
          <TableBodyCell>
            <button
              class="flex btn btn-ghost btn-sm"
              on:click|preventDefault={() => {
                deleteKey(key.id);
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                fill="currentColor"
                class="bi bi-trash"
                viewBox="0 0 16 16"
              >
                <path
                  d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5Zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5Zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6Z"
                />
                <path
                  d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1ZM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118ZM2.5 3h11V2h-11v1Z"
                />
              </svg>
            </button>
          </TableBodyCell>
        </TableBodyRow>
      {/each}
    </TableBody>
  </Table>
</div>

<Modal bind:open={modalOpen} size="xs" autoclose={false} class="w-full">
  <div class="flex flex-col space-y-6">
    <h3 class="mb-4 text-xl font-medium text-gray-900 dark:text-white">Create new API key</h3>
    {#if modalKey.length === 0}
      <Label class="space-y-2">
        <span>Key name</span>
        <input
          name="name"
          placeholder="My key name"
          required
          bind:value={modalKeyName}
          class="block w-full disabled:cursor-not-allowed disabled:opacity-50 focus:border-blue-500 focus:ring-blue-500 dark:focus:border-blue-500 dark:focus:ring-blue-500 bg-gray-50 text-gray-900 dark:bg-gray-600 dark:text-white dark:placeholder-gray-400 border-gray-300 dark:border-gray-500 p-2.5 text-sm rounded-lg"
          type="text"
        />
      </Label>
      <button
        type="submit"
        class="text-center font-medium focus:ring-4 focus:outline-none inline-flex items-center justify-center px-5 py-2.5 text-sm text-white bg-blue-700 hover:bg-blue-800 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800 rounded-lg w-full1"
        on:click|preventDefault={createKey}>Create</button
      >
    {:else}
      <Label class="space-y-2">
        <span>Key</span>
        <input
          disabled
          bind:value={modalKey}
          class="block w-full disabled:cursor-not-allowed disabled:opacity-50 focus:border-blue-500 focus:ring-blue-500 dark:focus:border-blue-500 dark:focus:ring-blue-500 bg-gray-50 text-gray-900 dark:bg-gray-600 dark:text-white dark:placeholder-gray-400 border-gray-300 dark:border-gray-500 p-2.5 text-sm rounded-lg"
          type="text"
        />
      </Label>
      <button
        type="submit"
        class="text-center font-medium focus:ring-4 focus:outline-none inline-flex items-center justify-center px-5 py-2.5 text-sm text-white bg-red-700 hover:bg-red-800 focus:ring-red-300 dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-800 rounded-lg w-full1"
        on:click|preventDefault={() => {
          modalOpen = false;
          modalKey = '';
        }}>Close</button
      >
    {/if}
  </div>
</Modal>
