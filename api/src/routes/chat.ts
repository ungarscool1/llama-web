import { Router, Request, Response, NextFunction } from 'express';
import type { ChildProcessWithoutNullStreams } from 'child_process';
import { Generation } from '../utils/generation';
import mongoose from 'mongoose';
import * as Sentry from '@sentry/node';
import * as yup from 'yup';
import { Message, Role } from '../types/Message';
import compileTemplate from '../utils/compileTemplate';

interface Chat {
  user: string;
  process: ChildProcessWithoutNullStreams;
}

let router = Router();
const generation = new Generation({
  executablePath: `${process.env.LLAMA_PATH}`,
});
const chatsProcess: Array<Chat> = [];

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  await mongoose.connect(`${process.env.DB}`);
  const chats = await mongoose.model('Chats').find({ user: req.user?.preferred_username }, '-__v');
  const chatsArray = chats.map((chat: any) => ({
    id: chat._id,
    user: chat.user,
    message: chat.messages[0].message,
    time: chat.time,
    model: chat.model.name
  })).reverse();
  res.json(chatsArray);
});

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  const schema = yup.object().shape({
    id: yup.string().optional(),
    model: yup.string().required(),
    message: yup.string().required()
  });
  let payload: yup.InferType<typeof schema>;
  let system = `Below is an instruction that describes a task. Write a response that appropriately completes the request. The response must be accurate, concise and evidence-based whenever possible. Here some information that can you help, the user name is ${req.user?.given_name}.`;
  let prompt = ``;
  let messages: Array<Message> = [];
  let ignoreIndex = 0;
  let response = '';
  let child: ChildProcessWithoutNullStreams;
  const transaction = Sentry.getActiveTransaction();
  let span: Sentry.Span|undefined;
  if (chatsProcess.find((chat) => chat.user === req.user?.preferred_username)) {
    return res.status(400).json({ message: 'There is already a chat in progress' });
  }

  if (transaction)
    span = transaction.startChild({ op: 'parsing', description: 'Parse request body' });
  try {
    payload = schema.validateSync(req.body);
  } catch (err) {
    console.error((err as Error).message);
    if (span)
      span.finish();
    return res.status(400).json({ message: 'Bad request' });
  }
  if (payload.id) {
    const chat = await mongoose.model('Chats').findById(payload.id);
    if (!chat || chat.user !== req.user?.preferred_username) {
      return res.status(400).json({ message: 'Chat not found' });
    }
    if (chat.model !== payload.model) {
      return res.status(400).json({ message: 'Model mismatch' });
    }
    messages = chat.messages;
  }
  const model = await mongoose.model('Models').findOne({ name: payload.model });
  if (span)
    span.finish();
    messages.push({ message: payload.message, role: Role.user });
  prompt += compileTemplate(model.chatPromptTemplate, { system: system, messages: messages });
  console.log(prompt);
  try {
    if (transaction)
      span = transaction.startChild({ op: 'generation', description: 'Generate response' });
    child = generation.launch({
      modelPath: `${process.env.MODELS_DIR}/${model.path}`,
      contextSize: 4096,
      temperature: 0.7,
      repeatPenalty: 1.1,
      threads: 4,
      nPredict: -1,
      prompt: prompt,
      interactive: false,
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
      if (process.env.NODE_ENV === 'development')
        console.error(`stdout - IGNORED(${ignoreIndex} - ${prompt.trim().length}): ${data}`);
    } else {
      if (process.env.NODE_ENV === 'development')
        console.error(`stdout - PUSHED: ${encodeURI(data)}`);
      response += data.toString();
      res.write(data.toString());
      res.flushHeaders();
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
    if (payload.id) {
      await Chat.findByIdAndUpdate(payload.id, {
        $push: {
          messages: {
            $each: [
              { message: payload.message, role: Role.user },
              { message: response.trim(), role: Role.assistant }
            ]
          }
        }
      });
    } else if (response) {
      const newChat = new Chat({
        user: req.user?.preferred_username,
        messages: [{message: payload.message, role: Role.user}, { message: response, role: Role.assistant }],
        time: new Date(),
        model: model
      });
      await newChat.save();
      res.write(`[[${newChat._id}]]`);
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
  let chat;
  let model;
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
  try {
    model = await mongoose.model('Models').findOne({ _id: chat.model });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
  res.json({
    id: chat._id,
    user: chat.user,
    messages: chat.messages,
    time: chat.time,
    model: model.name
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