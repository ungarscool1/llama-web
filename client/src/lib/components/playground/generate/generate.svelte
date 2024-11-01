<script lang="ts">
  import { env } from '$env/dynamic/public';
  import { onMount } from 'svelte';
  import { Label } from "$lib/components/ui/label/index.js";
  import * as Select from "$lib/components/ui/select";
  import { Textarea } from "$lib/components/ui/textarea/index.js";
  import { Badge } from "$lib/components/ui/badge/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import { Slider } from "$lib/components/ui/slider/index.js";
  import CornerDownLeft from "lucide-svelte/icons/corner-down-left";
  import Alert from '$lib/components/playground/alert/alert.svelte';
  import PlaygroundSlider from '$lib/components/ui/playground-slider/slider.svelte';

  $: prompt = '';
  $: isRequesting = false;
  $: errorMessage = '';
  $: parameterTemperature = [1];
  $: parameterLength = [512];
  $: parameterTopK = [40];
  $: parameterTopP = [0.9];
  $: model = {value: '', label: ''};
  $: models = [];
  let userInfo = {
    authenticated: false,
    token: null
  };

  onMount(() => {
    if (localStorage.getItem('userInfo')) {
      userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
      getModels();
    }
  });
  
  async function getModels() {
    const req = await fetch(`${env.PUBLIC_API_URL}/models`, {
      headers: {
        Authorization: `Bearer ${userInfo.token}`
      }
    });
    
    if (!req.ok) return goto('/');
    models = await req.json();
    models = models.filter(model => !model.alternativeBackend);
    model.label = models[0].name;
    model.value = models[0].name;
  }

  async function textCompletion() {
    const xhr = new XMLHttpRequest();
    if (prompt.length === 0) {
      errorMessage = 'Please enter a prompt';
      return;
    } else if (prompt.length > 2048) {
      errorMessage = 'Prompt is too long. Max length is 2048 characters';
      return;
    } else if (model.length === 0)  {
      errorMessage = 'Please select a model';
      return;
    } else {
      errorMessage = '';
    }
    xhr.open('POST', `${env.PUBLIC_API_URL}/text-completion`);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('Authorization', `Bearer ${userInfo.token}`);
    xhr.send(JSON.stringify({ prompt, parameters: {
      temperature: parameterTemperature[0],
      topK: parameterTopK[0],
      topP: parameterTopP[0],
      nPredict: parameterLength[0]
    }, model: model.value }));
    isRequesting = true;
    xhr.addEventListener('progress', (event) => {
      if (xhr.status !== 200) {
        errorMessage = JSON.parse(xhr.responseText).message;
        return;
      }
      const resText = xhr.responseText.trim();
      if (prompt.length < resText.length) prompt = resText;
    });
    xhr.onloadend = () => {
      isRequesting = false;
    };
  }
</script>
<div
    class="relative hidden flex-col items-start gap-8 md:flex"
    data-x-chunk-name="dashboard-03-chunk-0"
    data-x-chunk-description="A settings form a configuring an AI model and messages."
  >
    <form class="grid w-full items-start gap-6">
      <fieldset class="grid gap-6 rounded-lg border p-4">
        <legend class="-ml-1 px-1 text-sm font-medium"> Settings </legend>
        <div class="grid gap-3">
          <Label for="model">Model</Label>
          <Select.Root bind:selected={model}>
            <Select.Trigger
              id="model"
              class="items-start [&_[data-description]]:hidden"
            >
              <Select.Value placeholder="Select a model" />
            </Select.Trigger>
            <Select.Content class="max-h-[50vh] overflow-scroll">
              {#if models.length === 0}
                <Select.Item value="loading">Loading...</Select.Item>
              {/if}
              {#if models.length > 0}
                {#each models as model}
                  <Select.Item value={model.name}>
                    <div class="flex items-start gap-3 text-muted-foreground">
                      <div class="grid gap-0.5">
                        <p>
                          <span class="font-medium text-foreground">
                            {model.name}
                          </span>
                        </p>
                      </div>
                    </div>
                  </Select.Item>
                {/each}
              {/if}
            </Select.Content>
          </Select.Root>
        </div>
        <PlaygroundSlider label="Temperature" max={2} step={0.01} bind:parameterArray={parameterTemperature} />
        <PlaygroundSlider label="Length" min={1} max={8192} step={1} bind:parameterArray={parameterLength} />
        <PlaygroundSlider label="Top K" max={80} step={0.1} bind:parameterArray={parameterTopK} />
        <PlaygroundSlider label="Top P" max={1} step={0.01} bind:parameterArray={parameterTopP} />
      </fieldset>
    </form>
  </div>
  <div
    class="relative flex h-full min-h-[88dvh] flex-col rounded-xl bg-muted/50 p-4 lg:col-span-2"
  >
    <Badge variant="outline" class="absolute right-3 top-3">Output</Badge>
    <div class="flex-1 ">
      <Textarea
        id="message"
        placeholder="Write a fairy tale..."
        class="min-h-12 h-[90%] mt-7 resize-none border-0 p-3 shadow-none focus-visible:ring-0"
        bind:value={prompt}
      />
    </div>
    <div class="flex items-center p-3 pt-0">
      {#if errorMessage.length > 0}
        <Alert errorMessage={errorMessage} />
      {:else}
        <p class="text-sm">Completion is considered as legacy.</p>
      {/if}
      <Button type="submit" on:click={textCompletion} disabled={isRequesting} size="sm" class="ml-auto gap-1.5">
        Complete
        <CornerDownLeft class="size-3.5" />
      </Button>
    </div>
  </div>