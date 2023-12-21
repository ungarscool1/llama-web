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
  } from 'flowbite-svelte';
  import Edit from '../../../components/models/edit.svelte';
  import AddModel from '../../../components/models/addModel.svelte';

  $: models = [];
  let userInfo = {
    authenticated: false,
    token: null
  };
  let addModel = false;
  let editModel = false;
  let editId = '';
  $: onAddModalClose(addModel)

  onMount(() => {
    if (localStorage.getItem('userInfo')) {
      userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    }
    if (!userInfo.authenticated) {
      goto('/');
    } else {
      getModels();
      pingApi();
    }
  });
  
  function onAddModalClose(...args) {
    if (userInfo.authenticated) {
      getModels();
    }
  }

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

</script>

<div class="flex flex-row justify-between p-6">
  <div>
    <h1 class="text-xl font-semibold text-gray-900 dark:text-white">Models</h1>
    <p class="text-sm text-gray-500 dark:text-gray-400">Manage your Llama models</p>
  </div>
  <Button on:click={() => (addModel = true)}
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
    </svg>&nbsp; Add a new model</Button
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
          <TableBodyCell tdClass="px-6 py-4 whitespace-nowrap font-medium text-gray-900 dark:text-white flex">
              <button
                class="flex btn btn-ghost btn-sm mr-2"
                on:click|preventDefault={() => {
                  editId = model.id;
                  editModel = true;
                }}
              >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil" viewBox="0 0 16 16">
                <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325z"/>
              </svg>
              </button>
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

<AddModel bind:modalShow={addModel}></AddModel>

<Edit bind:id={editId} bind:modalShow={editModel}></Edit>