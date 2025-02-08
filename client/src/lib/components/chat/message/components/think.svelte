<script lang="ts">
  import * as Accordion from "$lib/components/ui/accordion/index.js";
  import Quote from "$lib/components/chat/message/components/quote.svelte";
  export let thinkText: string;
  export let thinking: boolean;
  export let index: number;
</script>

<Accordion.Root class="w-full">
  <Accordion.Item value={`item-${index}`} class="border-0">
    <Accordion.Trigger class="flex-none items-center justify-between py-0 pb-2 font-medium transition-all hover:no-underline {thinking ? 'animate-gradient text-transparent bg-clip-text bg-gradient-to-r from-gray-500 via-white to-gray-500 bg-clip-text bg-300%' : 'text-gray-500'}">{thinking ? "Thinking..." : `Thought`}</Accordion.Trigger>
    <Accordion.Content
      >
      <Quote quote={thinkText} />
      </Accordion.Content
    >
  </Accordion.Item>
</Accordion.Root>
