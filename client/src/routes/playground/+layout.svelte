<script lang="ts">
  import { page } from '$app/stores';
  import { env } from '$env/dynamic/public';
  import { onMount } from 'svelte';
  import * as Sheet from "$lib/components/ui/sheet";
  import { Button } from "$lib/components/ui/button/index.js";
  import * as DropdownMenu from "$lib/components/ui/dropdown-menu";
  import Menu from "lucide-svelte/icons/menu";
  import Package2 from "lucide-svelte/icons/command";
  import Avatar from '../../components/chat/avatar.svelte';
  import { goto } from '$app/navigation';
  import DarkMode from '$lib/components/ui/dark-mode/dark-mode.svelte';
  
  $: activeUrl = $page.url.pathname;
  let userName = '';
  let userEmail = '';
  let links = [
    {
      name: 'Playground',
      url: '/playground',
    },
    {
      name: 'Chat',
      url: '/chat',
    },
    {
      name: 'API docs',
      url: '/playground/api/docs',
    },
    {
      name: 'Models',
      url: '/playground/models',
    },
  ];
  onMount(() => {
    const store = JSON.parse(localStorage.getItem('userInfo') || '{}');
    if (env.PUBLIC_SKIP_AUTH === 'true') {
      userName = 'Anonymous';
      userEmail = '';
    } else if (store.authenticated) {
      const userInfo = JSON.parse(decodeURIComponent(escape(atob(store.token.split('.')[1]))));
      userName = userInfo.name;
      userEmail = userInfo.email;
    } else {
      goto('/login');
    }
  });
</script>

<header class="sticky z-50 top-0 flex h-16 items-center gap-4 border-b bg-white dark:bg-slate-950 px-4 md:px-6">
  <nav
    class="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6"
  >
    <a href="/" class="flex items-center gap-2 text-lg font-semibold md:text-base">
      <Package2 class="h-6 w-6" />
      <span class="sr-only">LLaMa AI</span>
    </a>
  </nav>
  <Sheet.Root>
    <Sheet.Trigger asChild let:builder>
      <Button
        variant="outline"
        size="icon"
        class="shrink-0 md:hidden"
        builders={[builder]}
      >
        <Menu class="h-5 w-5" />
        <span class="sr-only">Toggle navigation menu</span>
      </Button>
    </Sheet.Trigger>
    <Sheet.Content side="left">
      <nav class="grid gap-6 text-lg font-medium">
        <a href="##" class="flex items-center gap-2 text-lg font-semibold">
          <Package2 class="h-6 w-6" />
          <span class="sr-only">LLaMa AI</span>
        </a>
        {#each links as link}
        <a
          href={link.url}
          class="{activeUrl === link.url ? 'text-foreground' : 'text-muted-foreground'} hover:text-foreground"
        >
          {link.name}
        </a>
      {/each}
      </nav>
    </Sheet.Content>
  </Sheet.Root>
  <div class="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
    <div class="hidden ml-auto flex-1 flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6 sm:flex-initial md:block">
      {#each links as link}
        <a
          href={link.url}
          class="{activeUrl === link.url ? 'text-foreground' : 'text-muted-foreground'} transition-colors hover:text-foreground"
        >
          {link.name}
        </a>
      {/each}
      <DarkMode btnClass="text-muted-foreground transition-colors hover:text-foreground" />
    </div>
    <div class="block md:hidden ml-auto flex-1 sm:flex-initial relative"></div>
    {#if (env.PUBLIC_SKIP_AUTH === 'false' || !env.PUBLIC_SKIP_AUTH) && userName}
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild let:builder>
          <Button
            builders={[builder]}
            variant="ghost"
            size="icon"
            class="rounded-full"
          >
            <div class="w-8 h-8"><Avatar username={userName} /></div>
            <span class="sr-only">Toggle user menu</span>
          </Button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Content align="end">
          <DropdownMenu.Label>
            <span class="block text-sm"> {userName} </span>
            <span class="block truncate text-sm font-medium"> {userEmail} </span>
          </DropdownMenu.Label>
          <DropdownMenu.Separator />
          <DropdownMenu.Item href={env.PUBLIC_SSO_ACCOUNT_SETTINGS_URL} class="cursor-pointer">Settings</DropdownMenu.Item>
          <DropdownMenu.Item href="/playground/api" class="cursor-pointer">API Keys</DropdownMenu.Item>
          <DropdownMenu.Separator />
          <DropdownMenu.Item href="/logout" class="cursor-pointer">Sign out</DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Root>
    {/if}
  </div>
</header>
<div>
  <slot />
</div>