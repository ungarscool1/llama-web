<script lang="ts">
  import * as icons from 'lucide-svelte';
  export let name: string;
  
  function realName(): string {
    name = name.replace(/^([a-z])/, x => x.toUpperCase()).replaceAll(/-([a-z])/g, x => x.toUpperCase()).replaceAll('-', '');
    return name;
  }
</script>

<svelte:component this="{icons[realName()]}" {...$$props} />