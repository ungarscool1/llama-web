<script lang="ts">
  import Markdown from 'markdown-hljs';

  export let message: {
    message: string;
    isBot: boolean;
  };
</script>

<div class="flex mb-2 flex-row">
  <div class="flex">
    <img src="{message.isBot ? '/robot.svg' : '/person.svg'}" alt="{message.isBot ? 'Robot' : 'User'}" class="me-2 rounded-sm w-[50px] h-[50px]">
  </div>
  <p class="flex-1 mb-0 ml-1 dark:text-white text-black w-[95%]">
    {@html Markdown(message.message)}
  </p>
</div>