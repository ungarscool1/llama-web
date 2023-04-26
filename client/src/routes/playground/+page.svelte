<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { Tabs, TabItem } from 'flowbite-svelte';
  import Generate from '../../components/playground/generate.svelte';
  import Embedding from '../../components/playground/embedding.svelte';
  import Chat from '../../components/playground/chat.svelte';

  let userInfo = {
    authenticated: false,
    token: null
  };

  onMount(() => {
    if (localStorage.getItem('userInfo')) {
      userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    }
    if (!userInfo.authenticated) {
      goto('/');
    }
  });
</script>

<Tabs style="underline" contentClass="p-4 bg-white rounded-lg dark:bg-gray-800 mt-4">
  <TabItem open title="Generate/Complete">
    <Generate />
  </TabItem>
  <TabItem title="Embedding">
    <Embedding />
  </TabItem>
  <TabItem title="Chat">
    <Chat />
  </TabItem>
</Tabs>
