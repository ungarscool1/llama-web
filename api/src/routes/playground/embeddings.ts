import { Router, Request, Response, NextFunction } from 'express';
import { Generation } from '../../utils/generation';
import * as Sentry from '@sentry/node';
import * as yup from 'yup';

var router = Router();

router.post('/', (req: Request, res: Response, next: NextFunction) => {
  const schema = yup.object().shape({
    prompt: yup.string().required().min(1).max(2048),
  });
  let payload: yup.InferType<typeof schema>;
  const transaction = Sentry.getActiveTransaction();
  let span: Sentry.Span|undefined;
  
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
  if (span)
    span.finish();
  try {
    if (transaction)
      span = transaction.startChild({ op: 'generation', description: 'Generate response' });
    const generation = new Generation({
      executablePath: `${process.env.LLAMA_EMBEDDING_PATH}`,
      modelPath: `${process.env.LLAMA_MODEL}`
    });
    const response = generation.generateEmbeddings(payload.prompt);
    if (span)
      span.finish();
    return res.json(response);
  } catch (err) {
    console.error((err as Error).message);
    if (span)
      span.finish();
    return res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;