import { Router, Request, Response, NextFunction } from 'express';
import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import mongoose from 'mongoose';

let router = Router();

interface Chat {
  user: string;
  process: ChildProcessWithoutNullStreams;
}

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
  let index = 0;
  let response = '';
  let detecting = false;
  let detectionIndex = 0;
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
  prompt += `### Human:\n${payload.message}\n`;
  prompt += '### Assistant:\n';
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
    '--interactive',
    '--reverse-prompt', `### Human:`
  ]);
  const chatProcess: Chat = {
    user: `${req.user?.preferred_username}`,
    process: child,
  };
  chatsProcess.push(chatProcess);
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no'
  });
  res.status(200);
  res.flushHeaders();

  child.stdout.on('data', (data) => {
    if (index < prompt.length) {
      index += data.toString().length;
    } else {
      if (data.toString() === ':' && response.length === 0) {
        return;
      } else {
        response += data.toString();
      }
      if (data.toString().includes('#')) {
        detecting = true;
        detectionIndex = response.length;
      } else if (detecting && data.toString().includes(':')) {
        if (response.includes('Human')) {
          response = response.replace('### Human:', '');
          child.kill();
        } else {
          res.write(response.substring(detectionIndex, response.length));
          res.flushHeaders();
          detecting = false;
        }
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
    let id = '';
    const Chat = mongoose.model('Chats');
    console.log(`child process exited with code ${code}`);
    if (!payload.id && response) {
      const newChat = new Chat({
        user: req.user?.preferred_username,
        messages: [{message: payload.message, isBot: false}, { message: response, isBot: true }],
        time: new Date(),
      });
      await newChat.save();
      id = newChat._id;
    } else if (response.length === 0 || !response) {
      return res.end();
    } else {
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
    }
    res.write(`[[END OF CONVERSATION${id ? `|${id}` : ''}]]`);
    res.end();
    chatsProcess.splice(chatsProcess.indexOf(chatProcess), 1);
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
  await mongoose.connect(`${process.env.DB}`);
  const chat = await mongoose.model('Chats').findById(req.params.id);
  if (chat.user !== req.user?.preferred_username) {
    return res.status(403).send({ message: 'You are not allowed to delete this chat'});
  }
  await mongoose.model('Chats').findByIdAndDelete(req.params.id);
  res.status(200).json({ message: 'Chat deleted' });
});

module.exports = router;