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

router.get('/profile', requiresAuth(), function (req: Request, res: Response, next: NextFunction) {
  res.send(JSON.stringify(req.oidc.user));
});

module.exports = router;