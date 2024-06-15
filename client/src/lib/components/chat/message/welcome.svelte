<script lang="ts">
  import { env } from '$env/dynamic/public';
  import { onMount } from 'svelte';
  import * as Select from "$lib/components/ui/select/index.js";
  import QuickMessage from './components/quickMessage.svelte';
  type quickMessage = {icon: string; text: string;};

  let selectedModel = {value: '', label: ''};
  export let model = '';
  export let prompt: string;
  export let sendMessage: () => Promise<void>;
  $: onChange(selectedModel.value);
  $: models = [];
  let userInfo = {
    authenticated: false,
    token: null
  };
  let quickMessages: Array<quickMessage> = [];
  
  onMount(() => {
    if (localStorage.getItem('userInfo')) {
      userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
      getModels();
    }
    if (env.PUBLIC_QUICK_MESSAGES) {
      try {
        quickMessages = JSON.parse(env.PUBLIC_QUICK_MESSAGES);
        quickMessages = takeThreeRandomQuickMessages();
      } catch (e) {
        console.error('The quick messages list is malformated')
      }
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
  function takeThreeRandomQuickMessages(): Array<quickMessage> {
    const start = Math.random() * (quickMessages.length - 2);
    return quickMessages.slice(start, start+3);
  }
</script>
<div class="relative flex flex-col h-full justify-center items-center">
  <p class="text-2xl text-gray-900 dark:text-white leading-normal font-normal text-left whitespace-normal">How can I assist you today ?</p>
  <div class="flex max-w-3xl flex-wrap items-stretch justify-center gap-4 mt-4">
    {#each quickMessages as quickMessage, i}
      <QuickMessage icon={quickMessage.icon} text={quickMessage.text} onclick={() => {prompt = quickMessage.text; sendMessage();}} smallScreenHide={i === 0}/>
    {/each}
  </div>
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