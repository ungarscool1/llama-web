import { Router, Request, Response, NextFunction } from 'express';
import { Generation, GenerationLaunchOutput } from '../../utils/generation';
import * as Sentry from '@sentry/node';
import * as yup from 'yup';

var router = Router();

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  const schema = yup.object().shape({
    prompt: yup.string().required(),
    parameters: yup.object().shape({
      temperature: yup.number().min(0).max(1).required(),
      topK: yup.number().min(0).required(),
      topP: yup.number().min(0).max(1).required(),
      nPredict: yup.number().min(0).max(2048).required()
    })
  });
  let payload: yup.InferType<typeof schema>;
  const generation = new Generation({
    executablePath: `${process.env.LLAMA_PATH}`,
    modelPath: `${process.env.LLAMA_MODEL}`
  });
  const transaction = Sentry.getActiveTransaction();
  let span: Sentry.Span;
  let child: GenerationLaunchOutput;
  try {
    payload = await schema.validate(req.body);
  } catch (err) {
    return res.status(400).json({ message: 'Bad Request' });
  }
  try {
    if (transaction)
      span = transaction.startChild({ op: 'generation', description: 'Text completion' });
    child = generation.generateCompletion(payload.prompt, payload.parameters);
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
  child.stdout.on('data', (data: Buffer) => {
    res.write(data.toString());
    res.flushHeaders();
  });
  child.stderr.on('data', (data: Buffer) => {
    console.error(`stderr: ${data.toString()}`);
  });
  child.on('close', (code) => {
    if (span)
      span.finish();
    console.log(`child process exited with code ${code}`)
    res.end();
  });
});

export default router;