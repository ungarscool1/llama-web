<script lang="ts">
  import Keycloak from 'keycloak-js';
  import { env } from '$env/dynamic/public';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import Icon from '$lib/components/ui/icon/icon.svelte';

  let errorMessage: string = '';
  let keycloak: Keycloak;
  onMount(() => {
    if (env.PUBLIC_SKIP_AUTH === 'true') {
      localStorage.setItem('userInfo', JSON.stringify({ authenticated: true, token: '' }));
      return goto('/playground');
    }
    keycloak = new Keycloak({
      url: env.PUBLIC_SSO_SERVER,
      realm: env.PUBLIC_SSO_REALM,
      clientId: env.PUBLIC_CLIENT_ID
    });
    if (errorMessage.length !== 0) return;
    keycloak
      .init({ onLoad: 'login-required' })
      .then((authenticated: boolean) => {
        if (authenticated) {
          localStorage.setItem(
            'userInfo',
            JSON.stringify({ authenticated, token: keycloak.token })
          );
          const previousPage = localStorage.getItem('previousPage');
          if (previousPage) {
            localStorage.removeItem('previousPage');
            goto(previousPage);
          } else goto('/playground');
        } else {
          errorMessage = 'Cannot authenticate the user';
        }
      })
      .catch((err) => {
        errorMessage = `Error during Keycloak initialization: ${err}`;
      });
  });
</script>

<div class="grid h-screen place-items-center dark:text-white">
  <h1 class="text-4xl font-bold">Welcome to llama web</h1>
  <div class="flex flex-col items-center">
    {#if errorMessage.length === 0}
      {#if env.PUBLIC_SKIP_AUTH === 'false' || !env.PUBLIC_SKIP_AUTH}
        <p>Login in progress</p>
      {/if}
      <Icon name="loader-circle" class="animate-spin" />
    {:else}
      <p>{errorMessage}</p>
    {/if}
  </div>
</div>
