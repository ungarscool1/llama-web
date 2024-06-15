<script lang="ts">
    import { env } from "$env/dynamic/public";

  const endpoints = [
    {
      path: '/text-completion',
      method: 'POST',
      description: 'Generate text completion from prompt',
      body: {
        prompt: 'string',
        model: 'string',
        parameters: {
          temperature: 'number',
          topK: 'number',
          topP: 'number',
          nPredict: 'number'
        }
      },
      headers: [
        'Content-Type: application/json',
        'Authorization: Bearer <YOUR API KEY>'
      ]
    },
    {
      path: '/embeddings',
      method: 'POST',
      description: 'Generate embeddings from prompt',
      body: {
        prompt: 'string',
        model: 'string',
      },
      headers: [
        'Content-Type: application/json',
        'Authorization: Bearer <YOUR API KEY>'
      ]
    },
    {
      path: '/custom-chat',
      method: 'POST',
      description: 'Generate chat response from custom messages',
      body: {
        system: 'string',
        model: 'string',
        messages: [
          {
            message: 'string',
            role: 'human|assistant'
          }]
      },
      headers: [
        'Content-Type: application/json',
        'Authorization: Bearer <YOUR API KEY>'
      ]
    },
    {
      path: '/models',
      method: 'GET',
      description: 'Get all models',
      body: [{
        id: 'string',
        name: 'string',
        path: 'string',
        alternativeBackend: false,
        createdAt: 'string'
      }],
      headers: [
        'Authorization: Bearer <YOUR API KEY>'
      ]
    },
    {
      path: '/models/:id',
      method: 'GET',
      description: 'Get model by id (not by name)',
      body: {
        id: 'string',
        name: 'string',
        createdAt: 'string',
        parameters: {
          authentication: 'string?'
        },
        alternativeBackend: false
      },
      headers: [
        'Authorization: Bearer <YOUR API KEY>'
      ]
    },
    {
      path: '/models/:id',
      method: 'DELETE',
      description: 'Delete model by id (not by name)',
      headers: [
        'Authorization: Bearer <YOUR API KEY>'
      ]
    }
  ];
</script>

<div class="p-6">
  <h1 class="text-4xl font-extrabold dark:text-white">API documentation</h1>
  <p class="text-sm text-gray-500 dark:text-gray-400">
    API documentation page for LLaMa AI. Get started now.
  </p>
  <div class="p-5">
    <p class="mb-3 text-sm text-gray-500 md:text-lg dark:text-gray-400">API endpoint: <span>{env.PUBLIC_API_URL}</span></p>
    {#each endpoints as ep}
      <div>
        <h2 class="text-lg dark:text-white">
          <span
            class="inline-flex items-center justify-center px-2 ml-3 text-sm font-medium text-gray-800 bg-gray-200 rounded-md dark:bg-gray-700 dark:text-gray-300"
            >{ep.method}</span
          >
          · {ep.path}
        </h2>
        <p class="text-black dark:text-white">{ep.description}</p>
        <div class="text-black dark:text-white">
          <h3 class="text-lg">Headers</h3>
          <pre class="bg-gray-200 text-gray-900 dark:bg-gray-800 dark:text-gray-200 w-fit p-6">{ep.headers.filter(v => {
            if (env.PUBLIC_SKIP_AUTH === 'true' && v.startsWith('Authorization')) return false;
            return true;
          }).join('\n')}</pre>
          {#if ep.body}
            <h3 class="text-lg">Body</h3>
            <pre class="bg-gray-200 text-gray-900 dark:bg-gray-800 dark:text-gray-200 w-fit p-6">{JSON.stringify(ep.body, null, 2)}</pre>
          {/if}
        </div>
      </div>
    {/each}
  </div>
</div>
