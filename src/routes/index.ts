import { Router, Request, Response, NextFunction } from 'express';
import { requiresAuth } from 'express-openid-connect';
import { createHash } from 'crypto';

var router = Router();

interface Message {
  message: string;
  isBot: boolean;
}

router.get('/', (req: Request, res: Response, next: NextFunction) => {
  const messages: Message[] = [];
  res.render('index', {
    userProfile: {...req.oidc.user, gravatar: createHash('md5').update(req.oidc?.user?.email).digest('hex')},
    messages
  });
});

router.post('/message', (req: Request, res: Response, next: NextFunction) => {
  let payload: {message: string};
  
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

router.get('/profile', requiresAuth(), function (req: Request, res: Response, next: NextFunction) {
  res.send(JSON.stringify(req.oidc.user));
});

module.exports = router;