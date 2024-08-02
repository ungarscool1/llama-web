<script lang="ts">
  import { Input } from "$lib/components/ui/input/index.js";
  import { Slider } from "$lib/components/ui/slider/index.js";
  import { Label } from "$lib/components/ui/label/index.js";

  export let value = 0;
  export let min = 0;
  export let max = 100;
  export let step = 1;
  export let label = '';
  export let parameterArray = [0];

  function updateParameter(event, index) {
    console.log(event.target.value);
    const eventValue = parseFloat(event.target.value || 0);
    parameterArray[index] = eventValue;
    value = eventValue;
  }
</script>

<div class="grid gap-3">
  <div class="flex justify-between">
    <Label for="">{label}</Label>
    <Input type="number" value={parameterArray} on:input={(e) => updateParameter(e, 0)} min={min} max={max} step={step} class="w-14 h-6 remove-arrow p-0 m-0 text-center border-0 hover:border focus:border" />
  </div>
  <Slider bind:value={parameterArray} min={min} max={max} step={step} />
</div>