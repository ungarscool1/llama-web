import { Router, Request, Response, NextFunction } from 'express';
import { spawnSync } from 'child_process';

var router = Router();

interface Message {
  message: string;
  isBot: boolean;
}

const createLLAMAProcess = async (messages: Message[]) => {
  //run a child process
  const child = spawnSync(process.env.LLAMA_PATH, ['../llama.py'], {});
};


// TODO: Take a chat ID as a parameter
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  let payload: {messages: Array<Message>};
  
  if (!req.body.message) {
    return res.status(400).send('Message is required');
  }
  payload = req.body;
  res.set({
    'Content-Type': 'text/plain',
    'Transfer-Encoding': 'chunked',
  });
  const message = 'Hello world!';
  for (let i = 0; i < message.length; i++) {
    const chunk = message.charAt(i);
    res.write(chunk);
  }
  res.end();
});

module.exports = router;