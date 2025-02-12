<script lang="ts">
  import { Button } from '$lib/components/ui/button/index.js';
  import * as Tooltip from '$lib/components/ui/tooltip/index.js';
  import Icon from '$lib/components/ui/icon/icon.svelte';
  import hljs from 'highlight.js';
  import { type RunCodeResult } from '$lib/types/runcode';

  export let code: string;
  export let language: string;
  $: highlightedCode = hljs.highlightAuto(code);
  let runOutput: RunCodeResult;
  $: runningCode = false;
  const worker = new Worker(new URL('./runcode.worker.ts', import.meta.url), { type: 'module' });

  worker.onmessage = (event) => {
    runOutput = event.data;
    runningCode = false;
  };

  function copyToClipboard() {
    navigator.clipboard.writeText(code);
  }

  const runnableLanguages = ['javascript', 'lua', 'php', 'python', 'ruby'];
  const runCode = async () => {
    runningCode = true;
    worker.postMessage({ language, code });
  };
</script>

<div
  class="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-lg border border-gray-200 dark:border-gray-700 shadow-md"
>
  <div class="flex flex-row justify-between my-2 mx-4">
    <p>{language || highlightedCode.language}</p>
    <div>
      <Tooltip.Root>
        <Tooltip.Trigger asChild let:builder>
          <Button
            on:click={copyToClipboard}
            builders={[builder]}
            variant="link"
            class="h-auto w-auto px-0 py-0"
          >
            <Icon name="copy" class="w-4 h-4 text-gray-400" />
          </Button>
        </Tooltip.Trigger>
        <Tooltip.Content>
          <p>Copy to clipboard</p>
        </Tooltip.Content>
      </Tooltip.Root>
      {#if runnableLanguages.includes(language)}
        <Tooltip.Root>
          <Tooltip.Trigger asChild let:builder>
            <Button
              on:click={runCode}
              builders={[builder]}
              variant="link"
              disabled={runningCode}
              class="h-auto w-auto px-0 py-0"
            >
              {#if runningCode}
                <Icon name="loader" class="w-4 h-4 text-gray-400 animate-spin" />
              {:else}
                <Icon name="play" class="w-4 h-4 text-gray-400" />
              {/if}
            </Button>
          </Tooltip.Trigger>
          <Tooltip.Content>
            <p>Run the code</p>
          </Tooltip.Content>
        </Tooltip.Root>
      {/if}
    </div>
  </div>
  <div class="bg-white dark:bg-black  overflow-x-auto p-4">
    <pre><code>{@html highlightedCode.value.trim()}</code></pre>
  </div>
  {#if runOutput}
    <div class="bg-white dark:bg-black {!runOutput.image ? 'rounded-b-lg' : ''} overflow-x-auto p-4">
      <span class="pt-4 text-gray-500 text-xs mb-1">OUTPUT</span>
      <div>{@html (runOutput.error || runOutput.output.split('\n').map(line => `<div>${line}</div>`).join(''))}</div>
    </div>
    {#if runOutput.image}
    <div class="bg-white dark:bg-black rounded-b-lg overflow-x-auto p-4">
      <span class="pt-4 text-gray-500 text-xs mb-1">GENERATED IMAGE</span>
      <img src={`data:image/png;base64,${runOutput.image}`} alt="Output" class="w-full" />
    </div>
    {/if}
  {/if}
</div>
