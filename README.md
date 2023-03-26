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
yarn && yarn build
```

### Configuration

Copy the `example.env` file to `.env` and edit it.

> Disclaimer: `SKIP_AUTH` is not fully implemented yet. It can cause crashes.

### Running

```bash
yarn start
```

## Known issues

- Any user can send a message to any chat, even if he is not the owner of the chat. (But you can share it 😅)