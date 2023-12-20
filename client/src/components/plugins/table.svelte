<script lang="ts">
  import { env } from '$env/dynamic/public';
  import {
    Table,
    TableBody,
    TableBodyCell,
    TableBodyRow,
    TableHead,
    TableHeadCell
  } from 'flowbite-svelte';
  
  export let plugins: any[] = [];
  export let edition = false;
  export let editionMode: 'add' | 'edit' = 'add';
  export let pluginToEdit = '';
  export let userInfo = {
    authenticated: false,
    token: null
  };
  
  async function deletePlugin(id: string) {
    const req = await fetch(`${env.PUBLIC_API_URL}/plugins/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${userInfo.token}`
      }
    });
    if (!req.ok) return console.error('Error deleting plugin');
    plugins = plugins.filter((plugin) => plugin.id !== id);
  }
</script>

<Table>
  <caption
    class="p-5 text-lg font-semibold text-left text-gray-900 bg-white dark:text-white dark:bg-gray-800"
  />
  <TableHead>
    <TableHeadCell>Plugin name</TableHeadCell>
    <TableHeadCell>Version</TableHeadCell>
    <TableHeadCell>Author</TableHeadCell>
    <TableHeadCell>Created at</TableHeadCell>
    <TableHeadCell>Updated at</TableHeadCell>
    <TableHeadCell>
      <span class="sr-only"> Edit </span>
    </TableHeadCell>
  </TableHead>
  <TableBody tableBodyClass="divide-y">
    {#each plugins as plugin}
      <TableBodyRow>
        <TableBodyCell>{plugin.name}</TableBodyCell>
        <TableBodyCell>{plugin.version}</TableBodyCell>
        <TableBodyCell>{plugin.author}</TableBodyCell>
        <TableBodyCell>{new Date(plugin.createdAt).toLocaleString()}</TableBodyCell>
        <TableBodyCell>{new Date(plugin.updatedAt).toLocaleString()}</TableBodyCell>
        <TableBodyCell tdClass="px-6 py-4 whitespace-nowrap font-medium text-gray-900 dark:text-white flex">
          <button
            class="flex btn btn-ghost btn-sm mr-2"
            on:click|preventDefault={() => {
              edition = true;
              editionMode = 'edit';
              pluginToEdit = plugin.id;
            }}
          >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil" viewBox="0 0 16 16">
            <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325z"/>
          </svg>
          </button>
          <button
            class="flex btn btn-ghost btn-sm"
            on:click|preventDefault={() => {
              deletePlugin(plugin.id);
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