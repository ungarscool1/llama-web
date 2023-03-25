import { Router, Request, Response, NextFunction } from 'express';
import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import { requiresAuth } from 'express-openid-connect';

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

// TODO: Take a chat ID as a parameter
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  let payload: {messages: Array<Message>};
  let prompt = `Text transcript of a never ending dialog, where ${req.oidc?.user?.given_name} interacts with an AI assistant named LLaMa.\nLLaMa is helpful, kind, honest, friendly, good at writing and never fails to answer ${req.oidc?.user?.given_name}’s requests immediately and with details and precision.\nThere are no annotations like (30 seconds passed...) or (to himself), just what ${req.oidc?.user?.given_name} and LLaMa say aloud to each other.\nThe dialog lasts for years, the entirety of it is shared below. It's 10000 pages long.\nThe transcript only includes text, it can include markup like HTML but NO Markdown.\n\n${req.oidc?.user?.given_name}: Hello, LLaMA!\nLLaMA: Hello ${req.oidc?.user?.given_name}! How may I help you today?`;
  let index = 0;
  if (!req.body.messages) {
    return res.status(400).send('Messages is required');
  }
  if (!process.env.LLAMA_PATH || !process.env.LLAMA_MODEL) {
    throw new Error('LLAMA_PATH and LLAMA_MODEL must be set');
  }

  payload = req.body;
  for (const message of payload.messages) {
    prompt += `###${message.isBot ? 'Llama' : `${req.oidc?.user?.given_name}`}:\n${message.message}\n`;
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
  ]);
  chatsProcess.push({
    user: req.oidc?.user?.preferred_username,
    process: child,
  });
  res.set({
    'Content-Type': 'text/plain',
    'Transfer-Encoding': 'chunked',
  });
  res.flushHeaders();

  child.stdout.on('data', (data) => {
    if (index < prompt.length) {
      console.log(`index: ${index} | data length: ${data.toString().length} | data: ${data.toString()}`);
      index += data.toString().length;
    } else {
      console.log(`index: ${index} | data length: ${data.toString().length} | data: ${data.toString()}`);
      // Hack to avoid autochatting part 2
      if (data.toString().includes('###')) {
        // cut last chunk between ### and [[EOM]]
        const transformedData = data.toString().split('###')[0];
        res.write(transformedData);
        child.kill();
        return;
      }
      res.write(data.toString());
      res.flushHeaders();
    }
  });

  child.stderr.on('data', (data) => {
    console.error(`stderr: ${data}`);
  });

  child.on('close', (code) => {
    console.log(`child process exited with code ${code}`);
    res.write('[[END OF CONVERSATION]]');
    res.end();
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
module.exports = router;