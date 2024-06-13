<script lang="ts">
  import { env } from '$env/dynamic/public';
  import { onMount } from 'svelte';
  import * as Select from "$lib/components/ui/select/index.js";

  let selectedModel = {value: '', label: ''};
  export let model = '';
  $: onChange(selectedModel.value);
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
  function onChange(...args) {
    model = selectedModel.value;
  }
  async function getModels() {
    const req = await fetch(`${env.PUBLIC_API_URL}/models`, {
      headers: {
        Authorization: `Bearer ${userInfo.token}`
      }
    });
    
    if (!req.ok) return goto('/');
    models = await req.json();
    selectedModel = {value: models[0].name, label: models[0].name};
  }
</script>
<div class="relative flex flex-col h-full justify-center items-center">
  <p class="text-2xl text-gray-900 dark:text-white leading-normal font-normal text-left whitespace-normal">How can I assist you today ?</p>
</div>
<div class="overflow-hidden absolute top-4 left-4">
  <Select.Root bind:selected={selectedModel}>
    <Select.Trigger class="w-[180px]">
      <Select.Value placeholder="Select a model" />
    </Select.Trigger>
    <Select.Content>
      <Select.Group>
        {#each models as model}
          <Select.Item value={model.name} label={model.name}>{model.name}</Select.Item>
        {/each}
      </Select.Group>
    </Select.Content>
  </Select.Root>
</div>