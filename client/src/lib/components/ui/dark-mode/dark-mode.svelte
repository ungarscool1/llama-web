<script>
  import { onMount } from "svelte";
  import Icon from "../icon/icon.svelte";

  let isDarkMode = false;
  
  onMount(() => {
    isDarkMode = localStorage.getItem('color-theme') === 'dark' || window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  function toggleDarkMode() {
    isDarkMode = !isDarkMode;
    localStorage.setItem('color-theme', isDarkMode ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', isDarkMode === true);
  }
</script>

<button class="text-muted-foreground transition-colors hover:text-foreground" on:click={toggleDarkMode}>
  <Icon name={isDarkMode ? 'moon-star' : 'sun'} />
</button>