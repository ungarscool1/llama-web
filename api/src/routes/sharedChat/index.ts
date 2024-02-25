import { ISharedChat } from '@/models/sharedChat';
import { optionalAuthMiddleware, middleware, anonymousMiddleware } from '../../middleware';
import { Router, Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';

var router = Router();

router.get('/:id', optionalAuthMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  if (req.params.id.length < 24) {
    return res.status(400).json({ message: 'Invalid chat id' });
  }
  const sharedChat = await mongoose.model('SharedChats').findById<ISharedChat>(req.params.id);
  if (!sharedChat) {
    return res.status(404).json({ message: 'Shared chat not found' });
  }
  if (sharedChat.visibility === 'authenticated' && !(req.user)) {
    return res.status(403).send({ message: 'You are not allowed to access this shared chat'});
  }
  res.json({
    id: sharedChat._id,
    messages: sharedChat.messages.map((message: any) => ({
      role: message.role,
      message: message.message,
    })),
    visibility: sharedChat.visibility
  });
});

if (process.env.SKIP_AUTH === 'false' || !process.env.SKIP_AUTH) {
  router.use(middleware);
} else {
  router.use(anonymousMiddleware);
}

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  const sharedChats = await mongoose.model('SharedChats').find<ISharedChat>({ user: req.user?.preferred_username });
  res.json(sharedChats.map((sharedChat) => ({
    id: sharedChat._id,
    time: sharedChat.time,
    firstMessage: sharedChat.messages[0].message,
    model: sharedChat.model,
    visibility: sharedChat.visibility,
  })));
});

router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  if (req.params.id.length < 24) {
    return res.status(400).json({ message: 'Invalid chat id' });
  }
  const sharedChat = await mongoose.model('SharedChats').findById<ISharedChat>(req.params.id);
  if (!sharedChat) {
    return res.status(404).json({ message: 'Shared chat not found' });
  }
  if (sharedChat.user !== req.user?.preferred_username) {
    return res.status(403).send({ message: 'You are not allowed to delete this shared chat'});
  }
  await mongoose.model('SharedChats').findByIdAndDelete(req.params.id);
  res.status(200).json({ message: 'Shared chat deleted' });
});

export default router;