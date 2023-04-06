<script lang="ts">
    import { onMount } from "svelte";

  onMount(() => {
    localStorage.removeItem('userInfo');
  });
</script>

<div class="grid h-screen place-items-center dark:text-white">
  <h1 class="text-4xl font-bold">Logged out</h1>
</div>