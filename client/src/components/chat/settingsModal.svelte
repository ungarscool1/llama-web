<script lang="ts">
  import { Modal } from 'flowbite-svelte';
    import ChangeSystemPrompt from './settingsComponent/changeSystemPrompt.svelte';

  export let modalShow: boolean = false;
  
  /**
   * active: text-white bg-blue-700 hover:bg-blue-800 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none
   * inactive: text-black dark:text-white bg-transparent hover:bg-blue-500 hover:text-white font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-transparent dark:hover:bg-blue-700 focus:outline-none
  */
</script>

<Modal bind:open={modalShow} size="lg" autoclose={false} title="Settings" class="w-full">
  <div class="flex flex-row gap-6">
    <div class="flex flex-col gap-2">
      <button class="text-black dark:text-white bg-gray-200 hover:bg-gray-700 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-gray-600 dark:hover:bg-gray-700 focus:outline-none">Adjust LLM prompt</button>
    </div>
    <div class="flex-1 flex-col">
      <ChangeSystemPrompt />
    </div>
  </div>
</Modal>
