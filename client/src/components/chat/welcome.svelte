<script lang="ts">
  import { env } from '$env/dynamic/public';
  import { onMount } from 'svelte';
  import {
    P,
    Select,
  } from 'flowbite-svelte';

  export let model = "";
  $: models = [];
  let userInfo = {
    authenticated: false,
    token: null
  };
  
  onMount(() => {
    if (localStorage.getItem('userInfo')) {
      userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
      getModels();
    }
  });
  async function getModels() {
    const req = await fetch(`${env.PUBLIC_API_URL}/models`, {
      headers: {
        Authorization: `Bearer ${userInfo.token}`
      }
    });
    
    if (!req.ok) return goto('/');
    models = await req.json();
    model = models[0].name;
  }
</script>
<div class="overflow-hidden absolute top-4 left-4">
  <Select bind:value={model} placeholder=''>
    {#each models as model}
      <option value={model.name}>{model.name}</option>
    {/each}
  </Select>
</div>
<div class="relative flex flex-col h-full justify-center items-center">
  <P size="2xl">How can I assist you today ?</P>
</div>