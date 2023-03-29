import { Router, Request, Response, NextFunction } from 'express';
import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import mongoose from 'mongoose';

var router = Router();

interface Message {
  message: string;
  isBot: boolean;
}

interface Chat {
  user: string;
  process: ChildProcessWithoutNullStreams;
}

const chatsProcess: Array<Chat> = [];

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  await mongoose.connect(`${process.env.DB}`);
  const chats = await mongoose.model('Chats').find({ user: req.oidc?.user?.preferred_username });
  res.json(chats);
});

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  let payload: {messages: Array<Message>, id?: string};
  let prompt = `Text transcript of a never ending dialog, where ${req.oidc?.user?.given_name} interacts with an AI assistant named LLaMa.\nLLaMa is helpful, kind, honest, friendly, good at writing and never fails to answer ${req.oidc?.user?.given_name}’s requests immediately and with details and precision.\nThere are no annotations like (30 seconds passed...) or (to himself), just what ${req.oidc?.user?.given_name} and LLaMa say aloud to each other.\nThe dialog lasts for years, the entirety of it is shared below. It's 10000 pages long.\nThe transcript only includes text, it can include markup like HTML but NO Markdown. Finish your message by [[EOM]].\n\n${req.oidc?.user?.given_name}: Hello, LLaMA!\nLLaMA: Hello ${req.oidc?.user?.given_name}! How may I help you today?\n`;
  let index = 0;
  let response = '';
  if (!req.body.messages) {
    return res.status(400).send('Messages is required');
  }
  if (!process.env.LLAMA_PATH || !process.env.LLAMA_MODEL) {
    throw new Error('LLAMA_PATH and LLAMA_MODEL must be set');
  }
  if (chatsProcess.find((chat) => chat.user === req.oidc?.user?.preferred_username)) {
    return res.status(400).send('Chat already started');
  }

  await mongoose.connect(`${process.env.DB}`);
  payload = req.body;
  for (const message of payload.messages) {
    prompt += `${message.isBot ? 'LLaMa' : `${req.oidc?.user?.given_name}`}: ${message.message}\n`;
  }
  const child = spawn(process.env.LLAMA_PATH, [
    '-m', process.env.LLAMA_MODEL,
    '--ctx_size', '2048',
    '--temp', '0.7',
    '--top_k', '40',
    '--top_p', '0.5',
    '--repeat_last_n', '256',
    '--batch_size', '1024',
    '--repeat_penalty', '1.17647',
    '--threads', '4',
    '--n_predict', '2048',
    '--prompt', prompt,
    //'--interactive',
    '--reverse-prompt', `${req.oidc?.user?.given_name}:`
  ]);
  const chatProcess: Chat = {
    user: req.oidc?.user?.preferred_username,
    process: child,
  };
  chatsProcess.push(chatProcess);
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no'
  });

  child.stdout.on('data', (data) => {
    if (index < prompt.length + 7) {
      index += data.toString().length;
    } else {
      console.log(`index: ${index} | data length: ${data.toString().length} | data: ${encodeURIComponent(data.toString())}`);
      // Hack to avoid autochatting
      if (data.toString() == '\n') {
        const transformedData = data.toString().replace('\n', '');
        res.write(transformedData);
        child.kill();
        return;
      }
      response += data.toString();
      res.write(data.toString());
      res.flushHeaders();
    }
  });

  if (process.env.NODE_ENV === 'development') {
    child.stderr.on('data', (data) => {
      console.error(`stderr: ${data}`);
    });
  }

  child.on('close', async (code) => {
    let id = '';
    const Chat = mongoose.model('Chats');
    console.log(`child process exited with code ${code}`);
    if (!payload.id) {
      const newChat = new Chat({
        user: req.oidc?.user?.preferred_username,
        messages: [...payload.messages, { message: response, isBot: true }],
        time: new Date(),
      });
      await newChat.save();
      id = newChat._id;
    } else {
      await Chat.findByIdAndUpdate(payload.id, { $push: { messages: { message: payload.messages.pop()?.message, isBot: false } } });
      await Chat.findByIdAndUpdate(payload.id, { $push: { messages: { message: response.trim(), isBot: true } } });
    }
    res.write(`[[END OF CONVERSATION${id ? `|${id}` : ''}]]`);
    res.end();
    chatsProcess.splice(chatsProcess.indexOf(chatProcess), 1);
  });
});

router.get('/stop', (req: Request, res: Response, next: NextFunction) => {
  const chatProcess = chatsProcess.find((chat) => chat.user === req.oidc?.user?.preferred_username);
  if (chatProcess) {
    chatProcess.process.kill();
    chatsProcess.splice(chatsProcess.indexOf(chatProcess), 1);
  }
  res.status(200).send('Chat stopped');
});

router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  await mongoose.connect(`${process.env.DB}`);
  const chat = await mongoose.model('Chats').findById(req.params.id);
  if (chat.user !== req.oidc?.user?.preferred_username) {
    return res.status(403).send('Forbidden');
  }
  await mongoose.model('Chats').findByIdAndDelete(req.params.id);
  res.status(200).send('Chat deleted');
});

module.exports = router;