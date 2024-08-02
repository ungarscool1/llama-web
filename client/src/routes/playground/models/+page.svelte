<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { env } from '$env/dynamic/public';
  import { Button } from "$lib/components/ui/button/index.js";
  import { Icon } from '$lib/components/ui/icon';
  import * as Table from "$lib/components/ui/table";

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
    ><Icon name="plus" class="pr-2" /> Add a new model</Button
  >
</div>
<div class="p-6">
  <Table.Root>
    <Table.Caption class={models.length === 0 ? '' : 'hidden'}>An empty list of your models.</Table.Caption>
    <Table.Header>
      <Table.Row>
        <Table.Head>Model name</Table.Head>
        <Table.Head>Path</Table.Head>
        <Table.Head>Created at</Table.Head>
        <Table.Head>
          <span class="sr-only"> Edit </span>
        </Table.Head>
      </Table.Row>
    </Table.Header>
    <Table.Body>
      {#each models as model}
        <Table.Row>
          <Table.Cell>{model.name}</Table.Cell>
          <Table.Cell>{model.path}</Table.Cell>
          <Table.Cell>{new Date(model.createdAt).toLocaleString()}</Table.Cell>
          <Table.Cell class="flex"><button
            class="flex btn btn-ghost btn-sm mr-2"
            on:click|preventDefault={() => {
              editId = model.id;
              editModel = true;
            }}
          >
          <Icon name="pen" class="size-4" />
          </button>
        <button
          class="flex btn btn-ghost btn-sm"
          on:click|preventDefault={() => {
            deleteModel(model.id);
          }}
        >
          <Icon name="trash-2" class="size-4" />
        </button></Table.Cell>
        </Table.Row>
      {/each}
    </Table.Body>
  </Table.Root>
</div>

<AddModel bind:modalShow={addModel}></AddModel>

<Edit bind:id={editId} bind:modalShow={editModel}></Edit>