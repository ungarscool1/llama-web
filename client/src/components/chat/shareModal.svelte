<script lang="ts">
  import { onMount } from 'svelte';
  import { env } from '$env/dynamic/public';
  import {
    Modal,
    Label,
    Select,
    type SelectOptionType
  } from 'flowbite-svelte';

  export let id: string
  export let modalShow: boolean = false;
  $: onChange(modalShow)
  let visibility = 'private';
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
        })
        if (res.ok) {
          const data = await res.json();
          visibility = data.visibility;
        } else {
          visibility = 'private';
        }
      } else {
        visibility = 'private';
      }
    }
  }

  async function shareChat() {
    if (!id) return;
    if (visibility === 'private') {
      await fetch(`${env.PUBLIC_API_URL}/shared/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${userInfo.token}`
        }
      });
      modalShow = false;
      return;
    }
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
    modalShow = false;
  }
  
  const visibilityOptions: Array<SelectOptionType<string>> = [
    {
      name: 'Public',
      value: 'public'
    },
    (
      env.PUBLIC_SKIP_AUTH !== 'true'
      ? {
        name: 'Authenticated',
        value: 'authenticated'
      }
      : undefined
    ),
    {
      name: 'Private',
      value: 'private'
    }
  ].filter(Boolean);
</script>

<Modal bind:open={modalShow} size="xs" autoclose={false} class="w-full">
  <div class="flex flex-col space-y-6">
    <h3 class="mb-4 text-xl font-medium text-gray-900 dark:text-white">Share the chat</h3>
      <Label class="space-y-2">
        <span>Visibility</span>
        <Select
        items={visibilityOptions}
        bind:value={visibility}
        />
      </Label>
      <button
        type="submit"
        class="text-center font-medium focus:ring-4 focus:outline-none inline-flex items-center justify-center px-5 py-2.5 text-sm text-white bg-blue-700 hover:bg-blue-800 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800 rounded-lg w-full1"
        on:click|preventDefault={shareChat}>{visibility === 'private' ? 'Unshare' : 'Share'} chat</button
      >
  </div>
</Modal>