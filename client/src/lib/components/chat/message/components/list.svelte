<script lang="ts">
  import * as marked from 'marked';
  
  export let ordered: boolean = false;
  export let items: Array<any>;
</script>
<ul class="{ordered ? 'list-decimal' : 'list-disc'} list-inside text-slate-900 dark:text-white my-6 ml-6 list-disc [&>li]:mt-2">
  {#each items as item}
    <li>{@html marked
      .parse(item.text).toString().replaceAll(/<\/?p>/g, '')}</li>
  {/each}
</ul>