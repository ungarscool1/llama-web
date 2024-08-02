<script lang="ts">
  import { onMount } from 'svelte';
  import { env } from '$env/dynamic/public';
  import { Label } from "$lib/components/ui/label/index.js";
  import * as Dialog from "$lib/components/ui/dialog";
  import * as Select from "$lib/components/ui/select";
  import { Button } from "$lib/components/ui/button/index.js";
  import Link from "lucide-svelte/icons/link";
  import Unlink from "lucide-svelte/icons/unlink";

  export let id: string;
  export let modalShow: boolean = false;
  let isShared: boolean = false;
  $: onChange(modalShow);
  let visibility = {label: 'Public', value: 'public'};
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
        } else {
          isShared = false;
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
        visibility: visibility.value
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
      label: 'Public',
      value: 'public'
    },
    {
      label: 'Authenticated',
      value: 'authenticated'
    }
  ];
</script>

<Dialog.Root bind:open={modalShow} >
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>{isShared ? 'Unshare': 'Share'} the chat</Dialog.Title>
    </Dialog.Header>
    <div class="flex flex-col gap-6">
      {#if !isShared}
        {#if env.PUBLIC_SKIP_AUTH !== 'true'}
          <p class="text-gray-500">Messages you send after sharing won't be shared</p>
          <Label for="visibility">Visibility</Label>
          <Select.Root bind:selected={visibility}>
            <Select.Trigger
              id="model"
              class="items-start [&_[data-description]]:hidden"
            >
              <Select.Value placeholder="Select a model" />
            </Select.Trigger>
            <Select.Content>
              {#each visibilityOptions as option}
              <Select.Item value={option.value}>
                <div class="flex items-start gap-3 text-muted-foreground">
                  <div class="grid gap-0.5">
                    <p>
                      <span class="font-medium text-foreground">
                        {option.label}
                      </span>
                    </p>
                  </div>
                </div>
              </Select.Item>
              {/each}
            </Select.Content>
          </Select.Root>
        {:else}
          <p class="text-gray-500">
            Messages you send after sharing won't be shared. Anyone with the link will be able to
            access to the shared chat.
          </p>
        {/if}
        <Button on:click={shareChat}><Link class="size-4 mr-2" /> Share chat</Button>
      {:else}
        <div class="flex justify-between">
          <Button on:click={unshareChat} class="bg-red-700 hover:bg-red-800 dark:bg-red-600 dark:hover:bg-red-700"><Unlink class="size-4 mr-2" /> Unshare chat</Button>
          <Button on:click={copyLink}><Link class="size-4 mr-2" /> Copy link</Button>
        </div>
      {/if}
    </div>
  </Dialog.Content>
</Dialog.Root>
