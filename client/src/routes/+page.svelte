<script lang="ts">
  import Keycloak from 'keycloak-js';
  import { env } from '$env/dynamic/public';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';

  let keycloak: Keycloak;
  onMount(() => {
    keycloak = new Keycloak({
      url: env.PUBLIC_SSO_SERVER,
      realm: env.PUBLIC_SSO_REALM,
      clientId: env.PUBLIC_CLIENT_ID,
    });
    keycloak.init({ onLoad: 'login-required' }).then((authenticated: boolean) => {
      if (authenticated) {
        localStorage.setItem('userInfo', JSON.stringify({ authenticated, token: keycloak.token }));
        goto('/chat');
      } else {
        // Display error message
      }
    });
  });
</script>
<div class="grid h-screen place-items-center dark:text-white">
  <h1 class="text-4xl font-bold">Login in progress</h1>
  <p>This app require authentication</p>
</div>