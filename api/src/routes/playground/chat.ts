import { Router, Request, Response, NextFunction } from 'express';
import { Generation } from '../../utils/generation';
import { GenerationOutput, Providers } from '../../types/Generation';
import * as yup from 'yup';
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
  let child: GenerationOutput;
  if (!process.env.LLAMA_PATH || !process.env.MODELS_DIR) {
    throw new Error('LLAMA_PATH and MODELS_DIR must be set');
  }

  try {
    payload = schema.validateSync(req.body);
  } catch (err) {
    console.error((err as Error).message);
    return res.status(400).json({ message: 'Bad request' });
  }
  const model = await mongoose.model('Models').findOne({ name: payload.model });
  if (!model) {
    return res.status(400).json({ message: 'Model not found' });
  }
  if (!model.alternativeBackend) {
    try {
      prompt += compileTemplate(model.chatPromptTemplate, { system: payload.system, messages: payload.messages });
    } catch (e) {
      return res.status(500).json({ message: 'Unable to generate prompt from template' });
    }
  }
  try {
    if (!model.alternativeBackend) {
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
    } else {
      child = await generation.generateCompletionAlt(payload.messages, model, payload.system);
    }
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

  let buffer = '';
  child.data.on('data', (data) => {if (Object.values(Providers).includes(model.name.split('-')[0] as Providers)) {
    buffer += data.toString();
    let boundary = buffer.indexOf('\n');
    while (boundary !== -1) {
      const chunk = buffer.substring(0, boundary).trim();
      buffer = buffer.substring(boundary + 1);
      boundary = buffer.indexOf('\n');

      if (chunk.startsWith('data: ')) {
        const result = chunk.substring(6);
        try {
          JSON.parse(result).choices.forEach((choice: any) => {
            res.write(choice.delta.content);
            res.flushHeaders();
          });
        } catch (e) {}
      }
    }
    return;
  }
    if (model.alternativeBackend) {
      res.write(data.toString());
      res.flushHeaders();
      return;
    }
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

  if (!model.alternativeBackend) {
    child.stderr!.on('data', (data) => {
      if (process.env.NODE_ENV === 'development')
        console.error(`stderr: ${data}`);
      if (data.toString().includes('[end of text]'))
        child.kill();
    });
  }

  child.data.on('close', () => {
    res.end();
  });
});

export default router;