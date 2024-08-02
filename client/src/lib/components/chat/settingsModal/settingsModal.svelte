<script lang="ts">
  import * as Dialog from "$lib/components/ui/dialog";
  import { Button } from "$lib/components/ui/button/index.js";
  import ChangeSystemPrompt from './components/changeSystemPrompt.svelte';

  export let modalShow: boolean = false;
</script>

<Dialog.Root bind:open={modalShow} >
  <Dialog.Content class="md:max-w-[680px]">
    <Dialog.Header>
      <Dialog.Title>Settings</Dialog.Title>
    </Dialog.Header>
    <div class="flex flex-row gap-6">
      <div class="flex flex-col gap-2">
        <Button variant="ghost" class="bg-accent text-accent-foreground">Adjust LLM prompt</Button>
      </div>
      <div class="flex-1 flex-col">
        <ChangeSystemPrompt />
      </div>
    </div>
  </Dialog.Content>
</Dialog.Root>
