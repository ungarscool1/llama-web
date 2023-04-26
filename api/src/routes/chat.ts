import { Router, Request, Response, NextFunction } from 'express';
import type { ChildProcessWithoutNullStreams } from 'child_process';
import { Generation } from '../utils/generation';
import mongoose from 'mongoose';
import * as Sentry from '@sentry/node';

interface Chat {
  user: string;
  process: ChildProcessWithoutNullStreams;
}

let router = Router();
const generation = new Generation({
  executablePath: `${process.env.LLAMA_PATH}`,
  modelPath: `${process.env.LLAMA_MODEL}`
});
const chatsProcess: Array<Chat> = [];

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  await mongoose.connect(`${process.env.DB}`);
  const chats = await mongoose.model('Chats').find({ user: req.user?.preferred_username }, '-__v');
  const chatsArray = chats.map((chat: any) => ({
    _id: chat._id,
    user: chat.user,
    message: chat.messages[0].message,
    time: chat.time
  })).reverse();
  res.json(chatsArray);
});

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  await mongoose.connect(`${process.env.DB}`);
  let payload: {message: string, id?: string};
  let prompt = `Below is an instruction that describes a task. Write a response that appropriately completes the request. The response must be accurate, concise and evidence-based whenever possible. Here some information that can you help, the user name is ${req.user?.given_name}.`;
  let ignoreIndex = 0;
  let response = '';
  let detecting = false;
  let detectionIndex = 0;
  let child: ChildProcessWithoutNullStreams;
  const transaction = Sentry.getActiveTransaction();
  let span: Sentry.Span|undefined;
  if (!req.body.message) {
    return res.status(400).send('Message is required');
  }
  if (!process.env.LLAMA_PATH || !process.env.LLAMA_MODEL) {
    throw new Error('LLAMA_PATH and LLAMA_MODEL must be set');
  }
  if (chatsProcess.find((chat) => chat.user === req.user?.preferred_username)) {
    return res.status(400).json({ message: 'There is already a chat in progress' });
  }

  payload = req.body;
  if (transaction)
    span = transaction.startChild({ op: 'parsing', description: 'Parse request body' });
  if (payload.id) {
    const chat = await mongoose.model('Chats').findById(payload.id);
    if (!chat) {
      return res.status(400).json({ message: 'Chat not found' });
    }
    if (chat.user !== req.user?.preferred_username) {
      return res.status(400).json({ message: 'Chat not found' });
    }
    for (const message of chat.messages) {
      prompt += `${message.isBot ? '### Assistant' : `### Human`}:\n ${message.message}\n`;
    }
  }
  if (span)
    span.finish();
  prompt += `### Human:\n${payload.message}\n`;
  prompt += '### Assistant:\n';
  try {
    if (transaction)
      span = transaction.startChild({ op: 'generation', description: 'Generate response' });
    child = generation.launch({
      contextSize: 2048,
      temperature: 0.7,
      topK: 40,
      topP: 0.5,
      repeatLastN: 256,
      batchSize: 1024,
      repeatPenalty: 1.17647,
      threads: 4,
      nPredict: 2048,
      prompt: prompt,
      interactive: true,
      reversePrompt: '### Human:'
    });
  } catch (e) {
    return res.status(500).json({ message: 'Something went wrong' });
  }
  chatsProcess.push({
    user: `${req.user?.preferred_username}`,
    process: child
  });
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no'
  });
  res.status(200);
  res.flushHeaders();

  child.stdout.on('data', (data) => {
    if (ignoreIndex < prompt.length) {
      ignoreIndex += data.toString().length;
    } else {
      if (data.toString() === ':' && response.length === 0) {
        return;
      } else {
        response += data.toString();
      }
      if (data.toString().includes('### Human:')) {
        response = response.replace('### Human:', '');
        child.kill();
      } else if (!detecting) {
        res.write(data.toString());
        res.flushHeaders();
      }
    }
  });

  child.stderr.on('data', (data) => {
    if (process.env.NODE_ENV === 'development')
      console.error(`stderr: ${data}`);
    if (data.toString().includes('[end of text]'))
      child.kill();
  });

  child.on('close', async (code) => {
    const Chat = mongoose.model('Chats');
    if (span)
      span.finish();
    if (response && payload.id) {
      await Chat.findByIdAndUpdate(payload.id, {
        $push: {
          messages: {
            $each: [
              { message: payload.message, isBot: false },
              { message: response.trim(), isBot: true }
            ]
          }
        }
      });
      res.write(`[[END OF CONVERSATION]]`);
    } else if (response) {
      const newChat = new Chat({
        user: req.user?.preferred_username,
        messages: [{message: payload.message, isBot: false}, { message: response, isBot: true }],
        time: new Date(),
      });
      await newChat.save();
      res.write(`[[END OF CONVERSATION|${newChat._id}]]`);
    }
    res.end();
    chatsProcess.splice(chatsProcess.findIndex(c => c.user === req.user?.preferred_username), 1);
  });
});

router.get('/stop', (req: Request, res: Response, next: NextFunction) => {
  const chatProcess = chatsProcess.find((chat) => chat.user === req.user?.preferred_username);
  if (chatProcess) {
    chatProcess.process.kill();
    chatsProcess.splice(chatsProcess.indexOf(chatProcess), 1);
    return res.status(200).json({ message: 'Chat stopped' });
  }
  res.status(404).json({ message: 'Chat not found' });
});


router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  await mongoose.connect(`${process.env.DB}`);
  let chat;
  if (req.params.id.length < 24) {
    return res.status(400).json({ message: 'Invalid chat id' });
  }
  try {
    chat = await mongoose.model('Chats').findOne({ _id: req.params.id, user: req.user?.preferred_username }, '-__v');
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
  if (!chat) {
    return res.status(404).json({ message: 'Chat not found' });
  }
  res.json({
    _id: chat._id,
    user: chat.user,
    messages: chat.messages,
    time: chat.time
  });
});

router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  if (req.params.id.length < 24) {
    return res.status(400).json({ message: 'Invalid chat id' });
  }
  await mongoose.connect(`${process.env.DB}`);
  const chat = await mongoose.model('Chats').findById(req.params.id);
  if (chat.user !== req.user?.preferred_username) {
    return res.status(403).send({ message: 'You are not allowed to delete this chat'});
  }
  await mongoose.model('Chats').findByIdAndDelete(req.params.id);
  res.status(200).json({ message: 'Chat deleted' });
});

export default router;