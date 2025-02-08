<script lang="ts">
  import { page } from '$app/stores';
  import { onMount, tick } from 'svelte';
  import { goto } from '$app/navigation';
  import { env } from '$env/dynamic/public';
  import Sidebar from '$lib/components/chat/sidebar/sidebar.svelte';
  import Message from '$lib/components/chat/message/message.svelte';
  import Welcome from '$lib/components/chat/message/welcome.svelte';
    import Icon from '$lib/components/ui/icon/icon.svelte';

  $: activeUrl = $page.url.pathname;
  $: messages = [];
  $: onChange(activeUrl);
  $: prompt = '';
  $: model = '';
  let textArea: HTMLTextAreaElement;
  let isRequesting = false;
  let isPromptError = false;
  let isError = false;
  let chatBox: HTMLDivElement;
  let userInfo = {
    authenticated: false,
    token: null,
    name: ''
  };
  let atBottom = true;

  function goDown() {
    chatBox.scroll({
      top: chatBox.scrollHeight,
      behavior: 'smooth'
    });
  }
  function checkScroll() {
    atBottom = chatBox.scrollTop >= chatBox.scrollHeight - chatBox.clientHeight - 1;
  }
  
  function loadCodeHighlightCss() {
    const userTheme = localStorage.getItem('color-theme');
		const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.type = 'text/css';
    document.head.appendChild(link);
		if (userTheme === 'dark' || (!userTheme && systemPrefersDark)) {
			link.href = 'https://unpkg.com/@highlightjs/cdn-assets/styles/github-dark.min.css';
		} else {
			link.href = 'https://unpkg.com/@highlightjs/cdn-assets/styles/github.min.css';
		}
  }

  onMount(() => {
    if (localStorage.getItem('userInfo')) {
      userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
      if (userInfo.token) {
        userInfo.name = JSON.parse(decodeURIComponent(escape(atob(userInfo.token.split('.')[1]))))[
          'name'
        ];
      } else userInfo.name = 'Anonymous';
    }
    if (!userInfo.authenticated) {
      localStorage.setItem('previousPage', $page.url.pathname);
      goto('/');
    }
    loadCodeHighlightCss()
    fetchMessage();
    pingApi();
    chatBox.addEventListener('scroll', checkScroll);
    checkScroll();
  });

  async function onChange(...args) {
    const id = $page.params.id;
    if (!id) {
      messages = [];
      return;
    }
    await fetchMessage();
    if (chatBox) {
      checkScroll();
      chatBox.scroll({
        top: chatBox.scrollHeight,
        behavior: 'instant'
      });
    }
  }

  async function pingApi() {
    const req = await fetch(`${env.PUBLIC_API_URL}/`, {
      headers: {
        Authorization: `Bearer ${userInfo.token}`
      }
    });
    if (!req.ok) {
      localStorage.setItem('previousPage', $page.url.pathname);
      return goto('/');
    }
  }

  async function fetchMessage() {
    const id = $page.params.id;
    if (!id || !userInfo.authenticated) return;
    const req = await fetch(`${env.PUBLIC_API_URL}/chat/${id}`, {
      headers: {
        Authorization: `Bearer ${userInfo.token}`
      }
    });
    if (!req.ok) return console.log('Error');
    const res = await req.json();
    model = res.model;
    messages = res.messages;
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendRequest();
    }
  }

  async function sendRequest() {
    const xhr = new XMLHttpRequest();
    const id = $page.params.id;
    if (!isError && prompt.trim().length === 0) {
      isPromptError = true;
      return;
    }
    if (!isError) {
      messages = [
        ...messages,
        {
          message: prompt,
          role: 'user'
        }
      ];
    }
    xhr.open('POST', `${env.PUBLIC_API_URL}/chat`);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('Authorization', `Bearer ${userInfo.token}`);
    xhr.send(
      JSON.stringify({
        message: isError ? messages[messages.length - 2].message : prompt,
        id,
        model
      })
    );
    isRequesting = true;
    prompt = '';
    textArea.style.height = 'auto';
    if (!isError) {
      messages = [
        ...messages,
        {
          message: 'Waiting for response...',
          role: 'assistant'
        }
      ];
    } else {
      messages[messages.length - 1].message = 'Retrying...';
    }
    await tick();
    chatBox.scroll({ top: chatBox.scrollHeight, behavior: 'smooth' });
    xhr.addEventListener('progress', (event) => {
      let id: string | undefined;
      if (xhr.status === 200) {
        messages[messages.length - 1].message = xhr.responseText;
        if (atBottom) {
          chatBox.scroll({ top: chatBox.scrollHeight, behavior: 'instant' });
        } else {
          checkScroll();
        }
        if ((id = xhr.responseText.match(/\[\[(\w{24})\]\]/)?.[1]) !== undefined) {
          goto(`/chat/${id}`);
        }
      }
    });

    xhr.onloadend = () => {
      if (xhr.status !== 200) {
        const error = JSON.parse(xhr.responseText);
        messages[
          messages.length - 1
        ].message = `<!--ERROR: ${error.message}-->`;
        isError = true;
      } else {
        isError = false;
      }
      isRequesting = false;
    };
  }

  async function stopChat() {
    const req = await fetch(`${env.PUBLIC_API_URL}/chat/stop`, {
      headers: {
        Authorization: `Bearer ${userInfo.token}`
      }
    });
    if (!req.ok) return console.log('Error');
    isRequesting = false;
  }

  function onTextAreaInput() {
    textArea.style.height = 'auto';
    textArea.style.height = textArea.scrollHeight + 'px';
  }
</script>

<main class="h-[100dvh] w-screen overflow-hidden relative z-0 md:flex">
  <Sidebar />
  <div
    id="content"
    class="relative px-2 md:px-0 flex pt-1 h-full max-w-full flex-1 flex-col overflow-hidden"
  >
    <div
      id="chat-messages"
      class="overflow-y-auto md:px-10 mb-1 md:flex-grow w-full h-[calc(100dvh-8rem)] md:h-auto lg:flex lg:flex-col lg:items-center"
      bind:this={chatBox}
    >
      {#if messages.length > 0}
        <div class="lg:w-[75%]">
          {#each messages as message, i}
            <Message index={i} {message} username={userInfo.name} />
          {/each}
        </div>
      {:else}
        <Welcome bind:model bind:prompt sendMessage={sendRequest} />
      {/if}
    </div>
    <div class="flex justify-center items-center md:mb-2">
      <div class="w-full mx-5">
        <div class="flex flex-col w-full relative items-start">
          <textarea
            bind:this={textArea}
            draggable="false"
            rows="1"
            class="m-0 min-h-[52px] md:min-h-[54px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none pr-10 pl-3 md:py-3.5 md:pr-12 md:pl-4 {isPromptError
              ? 'border-red-700'
              : ''}"
            style="max-height: 200px;"
            placeholder="Ask me anything..."
            bind:value={prompt}
            on:input={onTextAreaInput}
            on:keypress={handleKeyDown}
          />
          {#if !isRequesting}
            <button
              class="absolute md:right-3 md:bottom-[0.6875rem] right-2 bottom-[0.6rem] inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 px-2 py-2"
              on:click|preventDefault={sendRequest}
              disabled={prompt.trim().length === 0}
            >
              <Icon name="arrow-up" class="size-4" />
            </button>
          {:else}
            <button
              class="absolute md:right-3 md:bottom-[0.6rem] right-2 bottom-[0.5125rem] inline-flex items-center justify-center whitespace-nowrap text-sm font-medium bg-transparent px-2 py-2"
              on:click|preventDefault={stopChat}
            >
              <Icon name="circle-stop" class="size-5" />
            </button>
          {/if}
        </div>
      </div>
    </div>
    {#if messages.length > 0}
      <button
        class="absolute z-10 text-gray-600 right-[46dvw] bottom-32 md:right-[40dvw] lg:right-[44.5dvw] md:bottom-20 {atBottom
          ? 'hidden'
          : 'block'} bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-600 hover:bg-gray-200 dark:hover:bg-slate-600 text-white font-bold py-2 px-2 rounded-full"
        on:click={goDown}
      >
        <Icon name="arrow-down-to-line" class="size-4 text-black dark:text-white" />
      </button>
    {/if}
  </div>
</main>
