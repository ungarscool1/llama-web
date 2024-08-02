import { Router, Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import * as yup from 'yup';

import { Generation } from '../utils/generation';
import { Message, Role } from '../types/Message';
import { IChat } from '../models/chat';
import { IModel } from '../models/model';

let router = Router();
const generation = new Generation({
  executablePath: `${process.env.LLAMA_PATH}`,
});

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  await mongoose.connect(`${process.env.DB}`);
  const chats = await mongoose.model('Chats').find<IChat>({ user: req.user?.preferred_username }, '-__v');
  const chatsArray = chats.map((chat) => ({
    id: chat._id,
    user: chat.user,
    message: chat.messages[0].message,
    time: chat.time
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
  let messages: Array<Message> = [];

  try {
    payload = schema.validateSync(req.body);
  } catch (err) {
    console.error((err as Error).message);
    return res.status(400).json({ message: 'Bad request' });
  }
  if (payload.id) {
    const chat = await mongoose.model('Chats').findById(payload.id).lean<IChat>();
    if (!chat || chat.user !== req.user?.preferred_username) {
      return res.status(400).json({ message: 'Chat not found' });
    }
    messages = chat.messages;
  }
  const model = await mongoose.model('Models').findOne<IModel>({ name: payload.model });
  if (!model) {
    return res.status(400).json({ message: 'Model not found' });
  }
  messages.push({ message: payload.message, role: Role.user });
  try {
    generation.generationWrapper(messages, model, res, req.user, payload.id);
  } catch (e) {
    return res.status(500).json({ message: 'Something went wrong' });
  }
});

router.get('/stop', (req: Request, res: Response, next: NextFunction) => {
  if (generation.stopGeneration(req.user?.preferred_username))
    return res.status(200).json({ message: 'Generation stopped' });
  res.status(404).json({ message: 'Chat not found' });
});


router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  let chat;
  let model;
  if (req.params.id.length < 24) {
    return res.status(400).json({ message: 'Invalid chat id' });
  }
  try {
    chat = await mongoose.model('Chats').findOne<IChat>({ _id: req.params.id, user: req.user?.preferred_username }, '-__v');
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
  if (!chat) {
    return res.status(404).json({ message: 'Chat not found' });
  }
  try {
    model = await mongoose.model('Models').findOne<IModel>({ _id: chat.model });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
  res.json({
    id: chat._id,
    user: chat.user,
    messages: chat.messages,
    time: chat.time,
    model: model ? model.name : 'Unknown'
  });
});

router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  if (req.params.id.length < 24) {
    return res.status(400).json({ message: 'Invalid chat id' });
  }
  await mongoose.connect(`${process.env.DB}`);
  const chat = await mongoose.model('Chats').findById<IChat>(req.params.id);
  if (!chat || chat.user !== req.user?.preferred_username) {
    return res.status(403).send({ message: 'You are not allowed to delete this chat'});
  }
  await mongoose.model('Chats').findByIdAndDelete(req.params.id);
  res.status(200).json({ message: 'Chat deleted' });
});

router.post('/:id/share', async (req: Request, res: Response, next: NextFunction) => {
  const schema = yup.object().shape({
    visibility: yup.string().oneOf(['public', 'authenticated']).required()
  });
  let payload: yup.InferType<typeof schema>;
  if (req.params.id.length < 24) {
    return res.status(400).json({ message: 'Invalid chat id' });
  }
  try {
    payload = schema.validateSync(req.body);
  } catch (err) {
    return res.status(400).json({ message: 'Bad request' });
  }
  const chat = await mongoose.model('Chats').findById<IChat>(req.params.id);
  if (!chat) {
    return res.status(404).json({ message: 'Chat not found' });
  }
  if (chat.user !== req.user?.preferred_username) {
    return res.status(403).send({ message: 'You are not allowed to share this chat'});
  }
  const SharedChat = mongoose.model('SharedChats');
  await SharedChat.findByIdAndDelete(req.params.id);
  const newSharedChat = new SharedChat({
    '_id': chat._id,
    user: chat.user,
    messages: chat.messages,
    time: chat.time,
    model: chat.model,
    visibility: payload.visibility
  });
  await newSharedChat.save();
  res.status(200).json({ message: 'Chat shared' });
});

export default router;