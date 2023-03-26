import { Router, Request, Response, NextFunction } from 'express';
import { createHash } from 'crypto';
import mongoose from 'mongoose';

var router = Router();

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  await mongoose.connect(`${process.env.DB}`);
  const chats = await mongoose.model('Chats').find({ user: req.oidc?.user?.preferred_username });
  res.render('index', {
    userProfile: {...req.oidc.user, gravatar: createHash('md5').update(req.oidc?.user?.email).digest('hex')},
    chats,
    chatId: null,
    messages: []
  });
});

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  await mongoose.connect(`${process.env.DB}`);
  const chats = await mongoose.model('Chats').find({ user: req.oidc?.user?.preferred_username });
  const messages = chats.find((chat) => chat._id.toString() === req.params.id)?.messages.map((message: any) => ({ message: message.message, isBot: message.isBot}));
  console.log(messages);
  res.render('index', {
    userProfile: {...req.oidc.user, gravatar: createHash('md5').update(req.oidc?.user?.email).digest('hex')},
    chats,
    chatId: req.params.id,
    messages: messages || []
  });
});

module.exports = router;