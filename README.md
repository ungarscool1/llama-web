# LLaMa Web

The LLaMa Web is a web interface to create a chat with a bot based on META LLaMa model.

## Installation

### Requirements

- NodeJS 18
- Yarn
- MongoDB (for saving chats)
- llama.cpp
- a model of llama
- Keycloak server (for authentication)

### Getting the model

Here, we getting vicuna model, more performant than llama model, alpaca or gpt4all.

- [Vicuna 7B](https://huggingface.co/eachadea/ggml-vicuna-7b-4bit)
- [Vicuna 13B](https://huggingface.co/eachadea/ggml-vicuna-13b-4bit)

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
