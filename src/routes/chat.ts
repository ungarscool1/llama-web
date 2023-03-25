import { Router, Request, Response, NextFunction } from 'express';
import { spawn } from 'child_process';
import { requiresAuth } from 'express-openid-connect';

var router = Router();

interface Message {
  message: string;
  isBot: boolean;
}

// TODO: Take a chat ID as a parameter
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  let payload: {messages: Array<Message>};
  let prompt = `Below is an instruction that describes a task. Write a response that appropriately completes the request. The response must be accurate, concise and evidence-based whenever possible. A complete answer is always ended by [[END OF CONVERSATION]].`;
  let index = 0;
  if (!req.body.messages) {
    return res.status(400).send('Messages is required');
  }
  if (!process.env.LLAMA_PATH || !process.env.LLAMA_MODEL) {
    throw new Error('LLAMA_PATH and LLAMA_MODEL must be set');
  }

  payload = req.body;
  for (const message of payload.messages) {
    prompt += `${message.isBot ? 'Llama' : req.oidc?.user?.given_name}: ${message.message}\n`;
  }
  const child = spawn(process.env.LLAMA_PATH, [
    '-m', process.env.LLAMA_MODEL,
    '--temp', '0.1',
    '--top_k', '50',
    '--top_p', '0.95',
    '-n', '256',
    '--repeat_last_n', '64',
    '--repeat_penalty', '1.3',
    '--threads', '4',
    '--ctx_size', '512',
    '-p', prompt,
    '--n_parts', '1',
  ]);
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

module.exports = router;