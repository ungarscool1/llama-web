import { Router, Request, Response, NextFunction } from 'express';
import { Generation, GenerationOutput } from '../../utils/generation';
import * as Sentry from '@sentry/node';
import * as yup from 'yup';
import mongoose from 'mongoose';

var router = Router();

const generation = new Generation({
  executablePath: `${process.env.LLAMA_PATH}`,
});

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  const schema = yup.object().shape({
    prompt: yup.string().required(),
    parameters: yup.object().shape({
      temperature: yup.number().min(0).max(1).required(),
      topK: yup.number().min(0).required(),
      topP: yup.number().min(0).max(1).required(),
      nPredict: yup.number().min(0).max(2048).required()
    }),
    model: yup.string().required()
  });
  let payload: yup.InferType<typeof schema>;
  const transaction = Sentry.getActiveTransaction();
  let span: Sentry.Span;
  let child: GenerationOutput;
  try {
    payload = await schema.validate(req.body);
  } catch (err) {
    return res.status(400).json({ message: 'Bad Request' });
  }
  const model = await mongoose.model('Models').findOne({ name: payload.model });
  if (!model) {
    return res.status(400).json({ message: 'Model not found' });
  }
  if (model.alternativeBackend)
    return res.status(400).json({ message: 'Alternative backend model are not supported' });
  try {
    if (transaction)
      span = transaction.startChild({ op: 'generation', description: 'Text completion' });
    child = generation.generateCompletion(payload.prompt, {...payload.parameters, modelPath: `${process.env.MODELS_DIR}/${model.path}`});
  } catch (err) {
    console.log((err as Error).message);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no'
  });
  res.status(200);
  res.flushHeaders();
  child.data.on('data', (data: Buffer) => {
    res.write(data.toString());
    res.flushHeaders();
  });
  child.stderr!.on('data', (data: Buffer) => {
    console.error(`stderr: ${data.toString()}`);
  });
  child.data.on('close', () => {
    if (span)
      span.finish();
    res.end();
  });
});

export default router;