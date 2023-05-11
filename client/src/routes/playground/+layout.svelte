<script lang="ts">
  import { page } from '$app/stores';
  import { env } from '$env/dynamic/public';
  import { onMount } from 'svelte';
  import { Navbar, NavBrand, NavLi, NavUl, NavHamburger, DarkMode, Dropdown, DropdownHeader, DropdownItem } from 'flowbite-svelte';
  import { goto } from '$app/navigation';
  
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
      name: 'API documentation',
      url: '/playground/api/docs',
    },
  ];
  onMount(() => {
    const store = JSON.parse(localStorage.getItem('userInfo') || '{}');
    if (store.authenticated) {
      const userInfo = JSON.parse(decodeURIComponent(escape(atob(store.token.split('.')[1]))));
      userName = userInfo.name;
      userEmail = userInfo.email;
    } else {
      goto('/login');
    }
  });
</script>

<Navbar
  navClass="px-2 sm:px-4 py-2.5 absolute w-full z-20 top-0 left-0 border-b"
  let:hidden
  let:toggle
>
  <NavBrand href="/playground">
    <span class="self-center whitespace-nowrap text-xl font-semibold dark:text-white">LLaMa AI</span
    >
  </NavBrand>
  <NavHamburger on:click={toggle} />
  <NavUl {hidden}>
    {#each links as link}
      <NavLi href={link.url} active={activeUrl === link.url}>{link.name}</NavLi>
    {/each}
    {#if env.PUBLIC_SKIP_AUTH === 'false' || !env.PUBLIC_SKIP_AUTH}
      <NavLi id="profile" style="cursor: pointer;">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="bi bi-person-fill" viewBox="0 0 16 16">
          <path d="M3 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1H3Zm5-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/>
        </svg>
      </NavLi>
    {/if}
    <NavLi>
      <DarkMode btnClass="" />
    </NavLi>
  </NavUl>
</Navbar>
{#if env.PUBLIC_SKIP_AUTH === 'false' || !env.PUBLIC_SKIP_AUTH}
  <Dropdown placement="bottom" triggeredBy="#profile" frameClass="mt-16 sm:mt-16 md:mt-20 lg:mt-20 xl:mt-20 2xl:mt-20">
    <DropdownHeader>
      <br/>
      <span class="block text-sm"> {userName} </span>
      <span class="block truncate text-sm font-medium"> {userEmail} </span>
    </DropdownHeader>
    <DropdownItem href={env.PUBLIC_SSO_ACCOUNT_SETTINGS_URL}>Settings</DropdownItem>
    <DropdownItem href="/playground/api">API Keys</DropdownItem>
    <DropdownItem href="/logout">Sign out</DropdownItem>
  </Dropdown>
{/if}
<div class="mt-16 sm:mt-16 md:mt-20 lg:mt-20 xl:mt-20 2xl:mt-20">
  <slot />
</div>