<script lang="ts">
  import * as Table from "$lib/components/ui/table/index.js";

  export let header: any;
  export let rows: any;
</script>

<Table.Root class="overflow-x-auto rounded-lg w-full md:w-[75%] border dark:border-gray-700">
  <Table.Header>
    <Table.Row>
      {#each header as head}
      <Table.Head>{head.text}</Table.Head>
      {/each}
    </Table.Row>
  </Table.Header>
  <Table.Body>
    {#each rows as row}
      <Table.Row>
        {#each row as cell}
          <Table.Cell>{cell.text}</Table.Cell>
        {/each}
      </Table.Row>
    {/each}
  </Table.Body>
</Table.Root>
