<script lang="ts">
  import { onMount } from 'svelte';
  import { env } from '$env/dynamic/public';
  import { Modal, Label, Select, type SelectOptionType } from 'flowbite-svelte';
  import Link45DegIcon from '../icons/Link45DegIcon.svelte';

  export let id: string;
  export let modalShow: boolean = false;
  let isShared: boolean = false;
  $: onChange(modalShow);
  let visibility = 'public';
  let userInfo = {
    authenticated: false,
    token: null
  };

  onMount(() => {
    if (localStorage.getItem('userInfo')) {
      userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    }
  });

  async function onChange(...args) {
    if (modalShow) {
      if (id) {
        const res = await fetch(`${env.PUBLIC_API_URL}/shared/${id}`, {
          headers: {
            Authorization: `Bearer ${userInfo.token}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          visibility = data.visibility;
          isShared = true;
        }
      }
    }
  }

  async function unshareChat() {
    if (!id) return;
    if (!isShared) return;
    await fetch(`${env.PUBLIC_API_URL}/shared/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${userInfo.token}`
      }
    });
    isShared = false;
  }

  async function shareChat() {
    if (!id) return;
    await fetch(`${env.PUBLIC_API_URL}/chat/${id}/share`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${userInfo.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        visibility
      })
    });
    isShared = true;
    copyLink();
  }
  
  function copyLink() {
    const link = `${window.location.origin}/share/${id}`;
    navigator.clipboard.writeText(link);
  }

  const visibilityOptions: Array<SelectOptionType<string>> = [
    {
      name: 'Public',
      value: 'public'
    },
    env.PUBLIC_SKIP_AUTH !== 'true'
      ? {
          name: 'Authenticated',
          value: 'authenticated'
        }
      : undefined
  ].filter(Boolean);
</script>

<Modal bind:open={modalShow} size="xs" autoclose={false} class="w-full">
  <div class="flex flex-col space-y-6">
    {#if !isShared}
      <h3 class="text-xl font-medium text-gray-900 dark:text-white">Share the chat</h3>
      {#if visibilityOptions.length > 1}
        <p class="text-gray-500">Messages you send after sharing won't be shared</p>
        <Label class="space-y-2">
          <span>Visibility</span>
          <Select items={visibilityOptions} bind:value={visibility} />
        </Label>
      {:else}
        <p class="text-gray-500">
          Messages you send after sharing won't be shared. Anyone with the link will be able to
          access to the shared chat.
        </p>
      {/if}
      <button
        type="submit"
        class="text-center font-medium focus:outline-none inline-flex items-center justify-center px-5 py-2.5 text-sm text-white bg-blue-700 hover:bg-blue-800 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800 rounded-lg w-full1"
        on:click|preventDefault={shareChat}><Link45DegIcon /> Share chat</button
      >
    {:else}
      <h3 class="mb-4 text-xl font-medium text-gray-900 dark:text-white">Unshare the chat</h3>
      <div class="flex justify-between">
        <button
          type="submit"
          class="text-center font-medium focus:outline-none inline-flex items-center justify-center px-5 py-2.5 text-sm text-white bg-red-700 hover:bg-red-800 dark:bg-red-600 dark:hover:bg-red-700 rounded-lg w-full1"
          on:click|preventDefault={unshareChat}>Unshare chat</button
        >
        <button
          type="submit"
          class="text-center font-medium focus:outline-none inline-flex items-center justify-center px-5 py-2.5 text-sm text-white bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-700 rounded-lg w-full1"
          on:click|preventDefault={copyLink}><Link45DegIcon /> Copy link</button
        >
      </div>
    {/if}
  </div>
</Modal>
