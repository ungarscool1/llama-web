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
  let prompt = `Transcript of a dialog, where ${req.oidc?.user?.given_name} interacts with an Assistant named Llama. Llama is helpful, kind, honest, good at writing, and never fails to answer the ${req.oidc?.user?.given_name}'s requests immediately and with precision.\n${req.oidc?.user?.given_name}: Hello, Llama.\nLlama: Hello. How may I help you today?\n${req.oidc?.user?.given_name}: Please tell me the largest city in Europe.\nLlama: Sure. The largest city in Europe is Moscow, the capital of Russia.\n`;
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
    '-b', '128',
    '-n', '256',
    '--repeat_penalty', '1',
    '-p', prompt,
  ]);
  res.set({
    'Content-Type': 'text/plain',
    'Transfer-Encoding': 'chunked',
  });
  res.type('text/plain');

  child.stdout.on('data', (data) => {
    if (index < 381) {
      index += data.toString().length;
      res.write(data.toString());
    } else {
      res.write(data.toString());
    }
  });

  child.stderr.on('data', (data) => {
    //console.error(`stderr: ${data}`);
  });

  child.on('close', (code) => {
    console.log(`child process exited with code ${code}`);
    res.write('[[END OF CONVERSATION]]');
    res.end();
  });
});

module.exports = router;