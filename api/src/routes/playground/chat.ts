import { Router, Request, Response, NextFunction } from 'express';
import { Generation, GenerationLaunchOutput } from '../../utils/generation';
import * as yup from 'yup';
import * as Sentry from '@sentry/node';

const generation = new Generation({
  executablePath: `${process.env.LLAMA_PATH}`,
  modelPath: `${process.env.LLAMA_MODEL}`
});

var router = Router();

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  const schema = yup.object().shape({
    system: yup.string().required(),
    messages: yup.array().of(
      yup.object().shape({
        message: yup.string().required(),
        role: yup.string().ensure().oneOf(['assistant', 'human', 'Assistant', 'Human']).required()
      })
    ).required()
  });
  let payload: yup.InferType<typeof schema>;
  let prompt = ``;
  let ignoreIndex = 0;
  let response = '';
  let detecting = false;
  let detectionIndex = 0;
  let child: GenerationLaunchOutput;
  const transaction = Sentry.getActiveTransaction();
  let span: Sentry.Span|undefined;
  if (!process.env.LLAMA_PATH || !process.env.LLAMA_MODEL) {
    throw new Error('LLAMA_PATH and LLAMA_MODEL must be set');
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
  prompt += `${payload.system}\n\n`;
  for (const message of payload.messages)
    prompt += `### ${message.role.charAt(0).toUpperCase()}${message.role.substring(1)}:\n${message.message}\n`;
  prompt += '### Assistant:\n';
  console.log(prompt);
  if (span)
    span.finish();
  try {
    if (transaction)
      span = transaction.startChild({ op: 'generation', description: 'Generate response' });
    child = generation.launch({
      contextSize: 2048,
      temperature: 0.7,
      topK: 40,
      topP: 0.5,
      repeatLastN: 256,
      batchSize: 1024,
      repeatPenalty: 1.17647,
      threads: 4,
      nPredict: 2048,
      prompt: prompt,
      interactive: true,
      reversePrompt: '### Human:',
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

  child.stdout.on('data', (data) => {
    if (ignoreIndex < prompt.length) {
      ignoreIndex += data.toString().length;
    } else {
      if (data.toString() === ':' && response.length === 0) {
        return;
      } else {
        response += data.toString();
      }
      if (data.toString().includes('### Human:')) {
        response = response.replace('### Human:', '');
        child.kill();
      } else if (!detecting) {
        res.write(data.toString());
        res.flushHeaders();
      }
    }
  });

  child.stderr.on('data', (data) => {
    if (process.env.NODE_ENV === 'development')
      console.error(`stderr: ${data}`);
    if (data.toString().includes('[end of text]'))
      child.kill();
  });

  child.on('close', (code) => {
    if (span)
      span.finish();
    res.end();
  });
});

export default router;