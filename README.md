# LLaMa Web

The LLaMa Web is a web interface to create a chat with a bot based on META LLaMa model.

## Installation

### Requirements

- NodeJS 18
- Yarn
- MongoDB (for saving chats)
- llama.cpp
- a model of llama

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
