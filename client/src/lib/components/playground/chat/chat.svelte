<script lang="ts">
  import { env } from '$env/dynamic/public';
  import { onMount } from 'svelte';
  import { Label } from "$lib/components/ui/label/index.js";
  import * as Select from "$lib/components/ui/select";
  import { Textarea } from "$lib/components/ui/textarea/index.js";
  import { Badge } from "$lib/components/ui/badge/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import Rabbit from "lucide-svelte/icons/rabbit";
  import Turtle from "lucide-svelte/icons/turtle";
  import CornerDownLeft from "lucide-svelte/icons/corner-down-left";
  import PlusIcon from 'lucide-svelte/icons/plus';
  import ChatBubble from "$lib/components/ui/chat/playground.svelte";
  import Alert from "$lib/components/playground/alert/alert.svelte";
  
  $: system = '';
  $: messages = [];
  $: userMessage = '';
  $: role = 'user';
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
    model.label = models[0].name;
    model.value = models[0].name;
  }

  const switchPrompter = () => {
    role = role === 'user' ? 'assistant' : 'user';
  };
  function addMessage() {
    messages = [
      ...messages,
      {
        role,
        message: userMessage
      }
    ];
    userMessage = '';
  }
  
  async function chatResponse() {
    if (system.length === 0 && userMessage.length > 1)
      system = 'You are a helpful assistant.';
    if (isRequesting) return;
    isRequesting = true;
    errorMessage = '';
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${env.PUBLIC_API_URL}/custom-chat`);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('Authorization', `Bearer ${userInfo.token}`);
    messages = [
      ...messages,
      {
        role,
        message: userMessage
      }
    ];
    userMessage = '';
    xhr.send(JSON.stringify({ system, messages, model: model.value }));
    messages = [
      ...messages,
      {
        role: 'assistant',
        message: ''
      }
    ];
    xhr.addEventListener('progress', (event) => {
      const resText = xhr.responseText.trim();
      messages[messages.length - 1].message = resText;
    });
    xhr.onloadend = () => {
      if (xhr.status !== 200) {
        errorMessage = JSON.parse(xhr.responseText).message;
      }
      isRequesting = false;
    };
  }
  
  function removeMessage(i: number) {
    messages = messages.filter((_, index) => index !== i);
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
            <Select.Content class="max-h-[50vh] overflow-scroll">
              {#if models.length === 0}
                <Select.Item value="loading">Loading...</Select.Item>
              {/if}
              {#if models.length > 0}
                {#each models as model}
                  <Select.Item value={model.name}>
                    <div class="flex items-start gap-3 text-muted-foreground">
                      {#if model.alternativeBackend}
                        <Rabbit class="size-5" />
                      {:else}
                        <Turtle class="size-5" />
                      {/if}
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
      <fieldset class="grid gap-6 rounded-lg border p-4">
        <legend class="-ml-1 px-1 text-sm font-medium"> System </legend>
        <div class="grid gap-3">
          <Label for="content">Content</Label>
          <Textarea
            id="content"
            placeholder="You are a helpful assistant."
            class="min-h-[9.5rem]"
            bind:value={system}
          />
        </div>
      </fieldset>
    </form>
  </div>
  <div
    class="relative flex h-full min-h-[88dvh] flex-col rounded-xl bg-muted/50 p-4 lg:col-span-2"
  >
    <Badge variant="outline" class="absolute right-3 top-3">Output</Badge>
    <div class="flex-1 mt-4 h-70">
      {#each messages as message, i}
        {#if i === messages.length - 1 && errorMessage.length > 0}
          <Alert errorMessage={errorMessage} />
        {:else}
          <ChatBubble role={message.role} message={message.message} onRemove={() => {removeMessage(i)}} />
        {/if}
      {/each}
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
        bind:value={userMessage}
      />
      <div class="flex items-center p-3 pt-0">
        <Button
            type="button"
            on:click={switchPrompter}
            size="sm"
            class="bg-secondary text-black hover:text-white hover:bg-primary dark:text-white dark:hover:text-black"
          >
            {role.at(0)?.toUpperCase() + role.slice(1)}
          </Button>
        <div class="ml-auto gap-1.5">
          <Button
            type="button"
            on:click={addMessage}
            size="sm"
          >
            Add
            <PlusIcon class="size-3.5" />
          </Button>
          <Button type="submit" on:click={chatResponse} size="sm">
            Send Message
            <CornerDownLeft class="size-3.5" />
          </Button>
        </div>
        
      </div>
    </form>
  </div>