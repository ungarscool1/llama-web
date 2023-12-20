<script lang='ts'>
    import { onMount } from 'svelte';
  import { Node, Svelvet, Minimap, Controls } from 'svelvet';
  export let definition: string = '';
  let pipeline: any[] = [];
  let mermaidStr = '';
  
  $: onPipelineChange(definition)
  $: onMermaidChange(mermaidStr)
  
  function onPipelineChange(...args) {
    if (definition.length === 0) return;
    try {
      let temp = JSON.parse(definition);
      if (temp && temp.pipeline) {
        pipeline = temp.pipeline;
      }
    } catch (e) {
      console.error('the pipeline definition is not a valid JSON.');
      return;
    }
    mermaidStr = pipelineToMermaid(pipeline);
  }
  
  function onMermaidChange(...args) {
    console.log(mermaidStr);
  }
  
  function pipelineToMermaid(pipeline: any[]): string {
    console.log(pipeline);
    let mermaidStr = '';
    const asciiToAlphabet = (i: number) => (i + 9).toString(36).toUpperCase()
    for (let i = 0; i < pipeline.length; i++) {
      const node = pipeline[i];
      if (i === 0) {
        mermaidStr += `A[Start] --> ${asciiToAlphabet(i + 2)}[${node.id}]\n`;
      } else if (i === pipeline.length - 1) {
        mermaidStr += `${asciiToAlphabet(i + 1)} --> ${asciiToAlphabet(i + 2)}[${node.id}]\n`;
        mermaidStr += `${asciiToAlphabet(i + 2)} --> E[End]`;
      } else {
        mermaidStr += `${asciiToAlphabet(i + 1)} --> ${asciiToAlphabet(i + 2)}[${node.id}]\n`;
      }
    }
    console.log(mermaidStr);
    return mermaidStr;
  }
</script>

<Svelvet theme="dark" width={800} height={640} locked={true} on:connection={(e) => {
  console.log(e.detail);
  e.preventDefault();
}} bind:mermaid={mermaidStr} />