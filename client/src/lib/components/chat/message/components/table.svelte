<script lang="ts">
  import { Table, TableBody, TableBodyCell, TableBodyRow, TableHead, TableHeadCell } from 'flowbite-svelte';

  export let header: any;
  export let rows: any;
</script>

<Table divClass="overflow-x-auto rounded-lg w-full md:w-[75%] border dark:border-gray-700">
  <TableHead>
    {#each header as head}
      <TableHeadCell>{head.text}</TableHeadCell>
    {/each}
  </TableHead>
  <TableBody>
    {#each rows as row}
      <TableBodyRow>
        {#each row as cell}
          <TableBodyCell>{cell.text}</TableBodyCell>
        {/each}
      </TableBodyRow>
    {/each}
  </TableBody>
</Table>