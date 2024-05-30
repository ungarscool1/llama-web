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

  $: prompt = '';
  $: isRequesting = false;
  $: errorMessage = '';
  $: parameters = {
    temperature: [1],
    topK: [40],
    topP: [0.9],
    nPredict: [512]
  };
  $: temp = [1];
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
    // remove all alternative backend models
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
    xhr.send(JSON.stringify({ prompt, parameters, model: model.value }));
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
            <Select.Content>
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
        <div class="grid gap-3">
          <Label for="temperature">Temperature</Label>
          <Slider bind:value={temp} max={2} step={0.01} class="max-w-[70%]" />
          <p>{parameters.temperature}</p>
        </div>
        <div class="grid gap-3">
          <Label for="temperature">Length</Label>
          <Slider bind:value={parameters.nPredict} max={8192} step={1} class="max-w-[70%]" />
          <p>{parameters.temperature}</p>
        </div>
        <div class="grid gap-3">
          <Label for="temperature">Top P</Label>
          <Slider value={[parameters.topP]} max={1} step={0.01} class="max-w-[70%]" />
          <p>{parameters.temperature}</p>
        </div>
        <div class="grid gap-3">
          <Label for="temperature">Freq penal</Label>
          <Slider value={[parameters.nPredict]} max={2} step={0.01} class="max-w-[70%]" />
          <p>{parameters.temperature}</p>
        </div>
        <div class="grid gap-3">
          <Label for="temperature">Pres penal</Label>
          <Slider value={[parameters.temperature]} max={2} step={0.01} class="max-w-[70%]" />
          <p>{parameters.temperature}</p>
        </div>
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
        value={prompt}
      />
    </div>
    <div class="flex items-center p-3 pt-0">
      <p class="text-sm">Completion is considered as legacy.</p>
      <Button type="submit" on:click={textCompletion} size="sm" class="ml-auto gap-1.5">
        Complete
        <CornerDownLeft class="size-3.5" />
      </Button>
    </div>
  </div>