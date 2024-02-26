import { Router, Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import * as yup from 'yup';

import { IPrompt } from '../../models/prompt';

var router = Router();

const defaultPrompt = `Below is an instruction that describes a task. Write a response that appropriately completes the request. The response must be accurate, concise and evidence-based whenever possible.`;

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  let prompt: IPrompt|null = null;
  try {
    prompt = await mongoose.model('Prompts').findOne<IPrompt>({ user: req.user?.preferred_username });
  } catch (error) {
    return next(error);
  }
  if (prompt) {
    res.json({ prompt: prompt.prompt });
  } else {
    res.json({ prompt: defaultPrompt });
  }
});

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  const schema = yup.object().shape({
    prompt: yup.string().required()
  });
  let payload: yup.InferType<typeof schema>;
  try {
    payload = await schema.validate(req.body);
  } catch (error) {
    return res.status(400).json({ message: 'Bad request' });
  }
  try {
    await mongoose.model('Prompts').findOneAndUpdate({ user: req.user?.preferred_username }, { prompt: payload.prompt }, { upsert: true });
  } catch (error) {
    return next(error);
  }
  res.json({ message: 'Prompt updated successfully.' });
});

module.exports = router;