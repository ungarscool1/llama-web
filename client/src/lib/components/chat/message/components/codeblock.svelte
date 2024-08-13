<script lang="ts">
  import { Button } from "$lib/components/ui/button/index.js";
  import * as Tooltip from "$lib/components/ui/tooltip/index.js";
  import Icon from "$lib/components/ui/icon/icon.svelte";
  import hljs from 'highlight.js';
  
  export let code: string;
  export let language: string;
  $: highlightedCode = hljs.highlightAuto(code)
  function copyToClipboard() {
    navigator.clipboard.writeText(code);
  }
</script>

<div class="bg-gray-800 text-gray-500 dark:text-gray-400 rounded-lg border border-gray-200 dark:border-gray-700 shadow-md">
  <div class="flex flex-row justify-between my-2 mx-4">
    <p>{language || highlightedCode.language}</p>
    <Tooltip.Root>
      <Tooltip.Trigger asChild let:builder>
        <Button on:click={copyToClipboard} builders={[builder]} variant="link" class="h-auto w-auto px-0 py-0">
          <Icon name="copy" class="w-4 h-4 text-gray-400" />
        </Button>
      </Tooltip.Trigger>
      <Tooltip.Content>
        <p>Copy to clipboard</p>
      </Tooltip.Content>
    </Tooltip.Root>
  </div>
  <div class="bg-black rounded-b-lg overflow-x-auto p-4">
    <pre><code>{@html highlightedCode.value.trim()}</code></pre>
  </div>
</div>