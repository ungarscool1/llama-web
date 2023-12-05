<script lang="ts">
  import { List, Li } from 'flowbite-svelte';
  import * as marked from 'marked';
  
  export let ordered: boolean = false;
  export let items: Array<any>;
</script>
<List list={ordered ? 'decimal' : 'disc'} color="white">
  {#each items as item}
    <Li>{@html marked
      .parse(item.text).toString().replaceAll(/<\/?p>/g, '')}</Li>
  {/each}
</List>