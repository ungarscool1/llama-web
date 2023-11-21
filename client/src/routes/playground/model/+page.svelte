<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { env } from '$env/dynamic/public';
  import {
    Alert,
    Table,
    TableBody,
    TableBodyCell,
    TableBodyRow,
    TableHead,
    TableHeadCell,
    Button,
    Modal,
    Label,
    P,
    Progressbar
  } from 'flowbite-svelte';

  $: models = [];
  let userInfo = {
    authenticated: false,
    token: null
  };
  let modalOpen = false;
  let modalModelName = '';
  let modalModelUri = '';
  let modalModelPromptTemplate = '';
  let modelDownload = false;
  let modelDownloadProgress = 0;
  let modalErrorMessage = '';

  onMount(() => {
    if (localStorage.getItem('userInfo')) {
      userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    }
    if (!userInfo.authenticated) {
      goto('/');
    } else {
      pingApi();
    }
    getModels();
  });

  async function pingApi() {
    const req = await fetch(`${env.PUBLIC_API_URL}/`, {
      headers: {
        Authorization: `Bearer ${userInfo.token}`
      }
    });
    if (!req.ok) return goto('/');
  }

  async function getModels() {
    const req = await fetch(`${env.PUBLIC_API_URL}/models`, {
      headers: {
        Authorization: `Bearer ${userInfo.token}`
      }
    });
    if (!req.ok) return goto('/');
    models = await req.json();
  }

  async function deleteModel(id: string) {
    const req = await fetch(`${env.PUBLIC_API_URL}/models/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${userInfo.token}`
      }
    });
    if (!req.ok) return goto('/');
    getModels();
  }

  async function createModel() {
    if (modalModelName.length === 0) {
      modalErrorMessage = 'Please enter a name';
      return;
    }
    const req = await fetch(`${env.PUBLIC_API_URL}/settings/api`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${userInfo.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name: modalModelName, uri: modalModelUri, promptTemplate: modalModelPromptTemplate })
    });
    if (!req.ok) {
      modalErrorMessage = (await req.json()).message;
      return;
    }
    modalModelName = '';
    modalModelUri = '';
    modalModelPromptTemplate = '';
    modelDownload = true;
    getModels();
  }
</script>

<div class="flex flex-row justify-between p-6">
  <div>
    <h1 class="text-xl font-semibold text-gray-900 dark:text-white">Models</h1>
    <p class="text-sm text-gray-500 dark:text-gray-400">Manage your Llama models</p>
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
    </svg>&nbsp; Install a new model</Button
  >
</div>
<div>
  <Table>
    <caption
      class="p-5 text-lg font-semibold text-left text-gray-900 bg-white dark:text-white dark:bg-gray-800"
    />
    <TableHead>
      <TableHeadCell>Model name</TableHeadCell>
      <TableHeadCell>Path</TableHeadCell>
      <TableHeadCell>Created at</TableHeadCell>
      <TableHeadCell>
        <span class="sr-only"> Edit </span>
      </TableHeadCell>
    </TableHead>
    <TableBody tableBodyClass="divide-y">
      {#each models as model}
        <TableBodyRow>
          <TableBodyCell>{model.name}</TableBodyCell>
          <TableBodyCell>{model.path}</TableBodyCell>
          <TableBodyCell>{new Date(model.createdAt).toLocaleString()}</TableBodyCell>
          <TableBodyCell>
            <button
              class="flex btn btn-ghost btn-sm"
              on:click|preventDefault={() => {
                deleteModel(model.id);
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
    {#if !modelDownload}
      {#if modalErrorMessage.length > 0}
        <Alert color="red">
          <span class="font-medium">An error occured</span>
          {modalErrorMessage}
        </Alert>
      {/if}
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
        <input
          name="template"
          placeholder="Model prompt template"
          required
          bind:value={modalModelPromptTemplate}
          class="block w-full disabled:cursor-not-allowed disabled:opacity-50 focus:border-blue-500 focus:ring-blue-500 dark:focus:border-blue-500 dark:focus:ring-blue-500 bg-gray-50 text-gray-900 dark:bg-gray-600 dark:text-white dark:placeholder-gray-400 border-gray-300 dark:border-gray-500 p-2.5 text-sm rounded-lg"
          type="text"
        />
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
  </div>
</Modal>
