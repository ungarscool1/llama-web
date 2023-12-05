<script lang="ts">
  import { List, Li } from 'flowbite-svelte';
  
  export let ordered: boolean = false;
  export let items: Array<any>;
</script>
<List list={ordered ? 'decimal' : 'disc'} color="white">
  {#each items as item}
    <Li>{item.text}</Li>
  {/each}
</List>