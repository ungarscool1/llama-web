<script lang="ts">
  import { Icon } from "$lib/components/ui/icon";

  export let text: string;
  export let icon: string;
  export let onclick: any;
  export let smallScreenHide: boolean;
</script>

<button
  class="flew w-40 flex-col gap-2 border border-gray-100 rounded-2xl px-3 pb-4 pt-3 text-start align-top bg-transparent text-gray-900 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white{smallScreenHide ? ' hidden md:inline-block' : ''}"
  on:click={onclick}
>
  {#if icon}
    <Icon class="w-4" name={icon} />
  {/if}
  {text}
</button>