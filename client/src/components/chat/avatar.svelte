<script lang="ts">
  export let username: string = '';
  function getInitials(name: string) {
    if (name.toLowerCase() === 'llama-robot-assistant') return 'AI';
    return `${name.substring(0, 2)}`.toUpperCase();
  }
  function generateBackground(name: string) {
    let hash = 0;
    let i;

    if (name.toLowerCase() === 'llama-robot-assistant') return 'linear-gradient(320deg, #f77f00, #fcbf49, #eae2b7)';
    for (i = 0; i < name.length; i += 1) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    let color = '#';
  
    for (i = 0; i < 3; i += 1) {
      const value = (hash >> (i * 8)) & 0xff;
      color += `00${value.toString(16)}`.slice(-2);
    }
  
    return color;
  }
</script>

<div class="flex h-full w-full rounded-full text-white justify-center items-center select-none" style="background: {generateBackground(username)}">
  <span class="">{getInitials(username)}</span>
</div>