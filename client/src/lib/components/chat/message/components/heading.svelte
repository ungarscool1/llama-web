<script lang="ts">
  export let text: string;
  export let level: number = 1;
</script>

{#if level === 1}
  <h1 class="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">{text}</h1>
{:else if level === 2}
  <h2 class="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0">{text}</h2>
{:else if level === 3}
  <h3 class="scroll-m-20 text-2xl font-semibold tracking-tight">{text}</h3>
{:else if level === 4}
  <h4 class="scroll-m-20 text-xl font-semibold tracking-tight">{text}</h4>
{:else if level === 5}
  <h5 class="text-sm font-bold mt-6 mb-2">{text}</h5>
{:else if level === 6}
  <h6 class="text-xs font-bold mt-6 mb-2">{text}</h6>
{/if}