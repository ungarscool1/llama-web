<script lang="ts">
  import * as DropdownMenu from "$lib/components/ui/dropdown-menu";
  import Share from "lucide-svelte/icons/share";
  import Trash from "lucide-svelte/icons/trash-2";
  import Ellipsis from "lucide-svelte/icons/ellipsis";
  
  export let chat: { id: string, message: string };
  export let active: boolean;
  export let showShareModal: boolean;
  export let deleteChat: () => void;
</script>

<a href="/chat/{chat.id}" class="flex justify-between items-center p-2 text-base font-normal text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg whitespace-nowrap {active ? 'bg-gray-200 dark:bg-gray-700' : ''}">
  <span class="flex-1 overflow-hidden ml-3 mr-3">{chat.message}</span>
  {#if active}
    <DropdownMenu.Root>
      <DropdownMenu.Trigger><Ellipsis class="size-4"/></DropdownMenu.Trigger>
      <DropdownMenu.Content>
        <DropdownMenu.Group>
          <DropdownMenu.Item on:click={() => showShareModal = true}><Share class="size-4 mr-2"/> Share</DropdownMenu.Item>
          <DropdownMenu.Item on:click={deleteChat} class="text-red-500"><Trash class="size-4 mr-2"/> Delete</DropdownMenu.Item>
        </DropdownMenu.Group>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  {/if}
</a>