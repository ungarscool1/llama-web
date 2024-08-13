<script lang="ts">
  import { Button } from "$lib/components/ui/button/index.js";
  import * as Tooltip from "$lib/components/ui/tooltip/index.js";
  import Icon from "$lib/components/ui/icon/icon.svelte";
  import hljs from 'highlight.js';
  import { runPythonCode, runLuaCode, runRubyCode, runPhpCode, type RunCodeResult } from './runcode';
  
  export let code: string;
  export let language: string;
  $: highlightedCode = hljs.highlightAuto(code);
  $: runOutput = '';
  function copyToClipboard() {
    navigator.clipboard.writeText(code);
  }
  const runnableLanguages = ['javascript', 'lua', 'php', 'python', 'ruby'];
  const runCode = async () => {
    let result: RunCodeResult;
    switch (language) {
      case 'python':
        result = await runPythonCode(code);
        runOutput = result.error || result.output;
        break;
      case 'lua':
        result = await runLuaCode(code);
        runOutput = result.error || result.output;
        break;
      case 'ruby':
        result = await runRubyCode(code);
        runOutput = result.error || result.output;
        break;
      case 'php':
        result = await runPhpCode(code);
        runOutput = result.error || result.output;
        break;
      default:
        console.error(`Language ${language} is not supported`);
        break;
    }
  }
</script>

<div class="bg-gray-800 text-gray-500 dark:text-gray-400 rounded-lg border border-gray-200 dark:border-gray-700 shadow-md">
  <div class="flex flex-row justify-between my-2 mx-4">
    <p>{language || highlightedCode.language}</p>
    <div>
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
      {#if runnableLanguages.includes(language)}
      <Tooltip.Root>
        <Tooltip.Trigger asChild let:builder>
          <Button on:click={runCode} builders={[builder]} variant="link" class="h-auto w-auto px-0 py-0">
            <Icon name="play" class="w-4 h-4 text-gray-400" />
          </Button>
        </Tooltip.Trigger>
        <Tooltip.Content>
          <p>Run the code</p>
        </Tooltip.Content>
      </Tooltip.Root>
      {/if}
    </div>
  </div>
  <div class="bg-black rounded-b-lg overflow-x-auto p-4">
    <pre><code>{@html highlightedCode.value.trim()}</code></pre>
    {#if runOutput}
      <hr class="border-gray-700 dark:border-gray-600 my-4" />
      <pre><code>{runOutput}</code></pre>
    {/if}
  </div>
</div>