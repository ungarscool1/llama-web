<script lang="ts">
  import { env } from '$env/dynamic/public';
  import { onMount } from 'svelte';
  import { Label } from "$lib/components/ui/label/index.js";
  import * as Select from "$lib/components/ui/select";
  import { Textarea } from "$lib/components/ui/textarea/index.js";
  import { Badge } from "$lib/components/ui/badge/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import Rabbit from "lucide-svelte/icons/rabbit";
  import CornerDownLeft from "lucide-svelte/icons/corner-down-left";
  import Alert from "$lib/components/playground/alert/alert.svelte";

  $: prompt = '';
  $: result = '';
  $: isRequesting = false;
  $: errorMessage = '';
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

  async function generateEmbeddings() {
    if (prompt.length === 0) {
      errorMessage = 'Please enter a prompt';
      return;
    } else if (prompt.length > 128) {
      errorMessage = 'Prompt is too long. Max length is 128 characters';
      return;
    } else if (model.value.length === 0) {
      errorMessage = 'Please select a model';
      return;
    } else {
      errorMessage = '';
    }
    isRequesting = true;
    const res = await fetch(`${env.PUBLIC_API_URL}/embeddings`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${userInfo.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ prompt, model: model.value })
    });
    if (res.ok) {
      const jsonRes: Array<number> = await res.json();
      result = jsonRes.join('\n');
    } else {
      errorMessage = (await res.json()).message;
    }
    isRequesting = false;
  }
</script>
<div
    class="relative hidden flex-col items-start gap-8 md:flex"
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
                      <Rabbit class="size-5" />
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
      </fieldset>
    </form>
  </div>
  <div
    class="relative flex h-full min-h-[88dvh] flex-col rounded-xl bg-muted/50 p-4 lg:col-span-2"
  >
    <Badge variant="outline" class="absolute right-3 top-3">Output</Badge>
    <div class="flex-1 mt-4 h-70">
      {#if errorMessage.length > 0}
        <Alert errorMessage={errorMessage} />
      {:else}
        {result}
      {/if}
    </div>
    <form
      class="relative overflow-hidden rounded-lg border bg-background focus-within:ring-1 focus-within:ring-ring"
      data-x-chunk-name="dashboard-03-chunk-1"
      data-x-chunk-description="A form for sending a message to an AI chatbot. The form has a textarea and buttons to upload files and record audio."
    >
      <Label for="message" class="sr-only">Message</Label>
      <Textarea
        id="message"
        placeholder="Type your message here..."
        class="min-h-12 resize-none border-0 p-3 shadow-none focus-visible:ring-0"
        bind:value={prompt}
      />
      <div class="flex items-center p-3 pt-0">
        <div class="ml-auto gap-1.5">
          <Button type="submit" on:click={generateEmbeddings} disabled={isRequesting} size="sm">
            Generate
            <CornerDownLeft class="size-3.5" />
          </Button>
        </div>
      </div>
    </form>
  </div>