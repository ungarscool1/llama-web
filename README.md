# LLaMa Web

The LLaMa Web is a web interface to chat or play with LLaMa based models.

## Installation

### Requirements

- NodeJS 18
- Yarn
- MongoDB (for saving chats)
- llama.cpp
- a model of llama
- Keycloak server (for authentication / OPTIONAL)

### Building

```bash
cd client && yarn install --frozen-lockfile && yarn build
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

### Configuration

Copy the `example.env` file from the both folder to `.env` and edit it.

```bash
cp client/example.env client/.env && nano client/.env
cp api/example.env api/.env && nano api/.env
```

### Running

```bash
docker-compose up -d
```

## Adding a model

> [!NOTE]
> We assume you want to use [TheBloke/Llama-2-7B-Chat-GGUF](https://huggingface.co/TheBloke/Llama-2-7B-Chat-GGUF).

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
