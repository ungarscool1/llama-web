# LLaMa Web

The LLaMa Web is a web interface to chat or play with LLaMa based models.

## Installation

### Requirements

- NodeJS 18
- Yarn
- MongoDB (for saving chats)
- llama.cpp
- Keycloak server (for authentication / OPTIONAL)

### Building

```bash
cd client && pnpm install --frozen-lockfile && pnpm build
cd ..
cd api && yarn install --frozen-lockfile && yarn build
```

### Configuration

Copy the `example.env` file from the both folder to `.env` and edit it.

```bash
cp client/example.env client/.env && nano client/.env
cp api/example.env api/.env && nano api/.env
```

### Running

In the both folder run the following command:
```bash
yarn start
```

## Running with Docker

### Requirements

- Docker
- Docker Compose
- Download `docker-compose.yml` file

### Configuration

Edit the `docker-compose.yml` file and change the environment variables.

However, you can't change the `DB`, `LLAMA_PATH` and `LLAMA_EMBEDDING_PATH` variables.

If you don't want to use Keycloak, you can enable the `SKIP_AUTH` variable, by setting it to `true` in client AND api.

### Running

```bash
docker-compose up -d
```

## Adding a model

> [!NOTE]
> We assume you want to use [TheBloke/Llama-2-7B-Chat-GGUF](https://huggingface.co/TheBloke/Llama-2-7B-Chat-GGUF).
> Good to know: This project is tested by using [TheBloke](https://huggingface.co/TheBloke)'s GGUF model.

> [!NOTE]
> On Docker or without docker, the steps are the same.

1. Go to the playground
2. Then go to the `Models` tab
3. Click on `Install a new model`
4. Enter the name of the model (e.g. `llama-2-7b-chat`)
5. Enter the download link (e.g. `https://huggingface.co/TheBloke/Llama-2-7B-Chat-GGUF/resolve/main/llama-2-7b-chat.Q4_K_M.gguf`)
6. Enter the model chat template (can be found [here](PROMPTS.md))
7. Click on `Install the new model`
8. Wait until the model is installed, you can refresh the page to see when it is done.

## Use alternative compute backend

> [!WARNING]
> Built-in models management is not supported when using an alternative compute backend.
> You have to edit the alternative backend directly to support the model you want to use.
> No support will be provided for this.
> It is possible to use the built-in models management and the alternative compute backend at the same time.

> [!NOTE]
> You can disable alternative compute backend by setting `ALLOW_ALTERNATIVE_COMPUTE_BACKEND` to `false` in the api `.env` file.

### Requirements
- a server that can run an app similar to `examples/alt-backend/mixtral8x7B.py`

### Setup in LLaMa Web

1. Go to the playground
2. Then go to the `Models` tab
3. Click on `Install a new model`
4. Enter the name of the model (e.g. `llama-2-7b-chat`)
5. Press on `Use alternative compute backend`
6. Enter the compute backend url (e.g. `https://my-alternative-compute-backend.domain.com`)
7. Press on `Add the alternative backend model`

### Setup code execution

The code execution use a thing called Web assembly, who execute the code in a sandboxed environment directly in your browser.

Supported languages:
- Python (pyodide 0.26.2)
- [Lua](https://unpkg.com/@antonz/lua-wasi/dist/lua.wasm) (5.4.5)
- [Ruby](https://github.com/vmware-labs/webassembly-language-runtimes/releases/download/ruby%2F3.2.2%2B20230714-11be424/ruby-3.2.2.wasm) (3.2.2)
- [PHP](https://github.com/vmware-labs/webassembly-language-runtimes/releases/download/php%2F8.2.6%2B20230714-11be424/php-cgi-8.2.6.wasm) (8.2.6)

You have the choice between pyodide and python. Both are python interpreter compiled to WebAssembly, but pyodide can be slower than the other, because pyodide can download the python packages from the internet and pyodide is not included in the app.
