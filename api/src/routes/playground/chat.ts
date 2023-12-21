import { Router, Request, Response, NextFunction } from 'express';
import { Generation, GenerationOutput } from '../../utils/generation';
import * as yup from 'yup';
import * as Sentry from '@sentry/node';
import mongoose from 'mongoose';
import compileTemplate from '../../utils/compileTemplate';
import { Role } from '../../types/Message';

const generation = new Generation({
  executablePath: `${process.env.LLAMA_PATH}`,
});

var router = Router();

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  const schema = yup.object().shape({
    model: yup.string().required(),
    system: yup.string().required(),
    messages: yup.array().of(
      yup.object().shape({
        message: yup.string().required(),
        role: yup.string().oneOf([Role.user, Role.assistant]).required()
      })
    ).required()
  });
  let payload: yup.InferType<typeof schema>;
  let prompt = ``;
  let ignoreIndex = 0;
  let response = '';
  let detecting = false;
  let child: GenerationOutput;
  const transaction = Sentry.getActiveTransaction();
  let span: Sentry.Span|undefined;
  if (!process.env.LLAMA_PATH || !process.env.MODELS_DIR) {
    throw new Error('LLAMA_PATH and MODELS_DIR must be set');
  }

  if (transaction)
    span = transaction.startChild({ op: 'parsing', description: 'Parse request body' });
  try {
    payload = schema.validateSync(req.body);
  } catch (err) {
    console.error((err as Error).message);
    if (span)
      span.finish();
    return res.status(400).json({ message: 'Bad request' });
  }
  const model = await mongoose.model('Models').findOne({ name: payload.model });
  if (!model) {
    if (span)
      span.finish();
    return res.status(400).json({ message: 'Model not found' });
  }
  prompt += compileTemplate(model.chatPromptTemplate, { system: payload.system, messages: payload.messages });
  console.log(prompt);
  if (span)
    span.finish();
  try {
    if (transaction)
      span = transaction.startChild({ op: 'generation', description: 'Generate response' });
    child = generation.launch({
      modelPath: `${process.env.MODELS_DIR}/${model.path}`,
      contextSize: 4096,
      temperature: 0.7,
      repeatPenalty: 1.1,
      threads: 4,
      nPredict: -1,
      prompt: prompt,
      interactive: false,
    });
  } catch (e) {
    return res.status(500).json({ message: 'Something went wrong' });
  }
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no'
  });
  res.status(200);
  res.flushHeaders();

  child.data.on('data', (data) => {
    if (ignoreIndex < prompt.replaceAll(/<\/?s>/g, '').trim().length) {
      ignoreIndex += data.toString().length;
      if (process.env.NODE_ENV === 'development')
        console.error(`stdout - IGNORED(${ignoreIndex} - ${prompt.trim().length}): ${data}`);
    } else {
      if (process.env.NODE_ENV === 'development')
        console.error(`stdout - PUSHED: ${encodeURI(data)}`);
      res.write(data.toString());
      res.flushHeaders();
    }
  });

  child.stderr!.on('data', (data) => {
    if (process.env.NODE_ENV === 'development')
      console.error(`stderr: ${data}`);
    if (data.toString().includes('[end of text]'))
      child.kill();
  });

  child.data.on('close', () => {
    if (span)
      span.finish();
    res.end();
  });
});

export default router;