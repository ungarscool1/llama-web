import { Router, Request, Response, NextFunction } from 'express';
import { Generation } from '../../utils/generation';
import * as yup from 'yup';
import mongoose from 'mongoose';

var router = Router();

const generation = new Generation({
  executablePath: `${process.env.LLAMA_EMBEDDING_PATH}`,
});

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  const schema = yup.object().shape({
    prompt: yup.string().required().min(1).max(2048),
    model: yup.string().required()
  });
  let payload: yup.InferType<typeof schema>;
  
  try {
    payload = schema.validateSync(req.body);
  } catch (err) {
    console.error((err as Error).message);
    return res.status(400).json({ message: 'Bad request' });
  }
  try {
    const model = await mongoose.model('Models').findOne({ name: payload.model });
    if (!model) {
      return res.status(400).json({ message: 'Model not found' });
    }
    if (model.alternativeBackend)
      return res.status(400).json({ message: 'Alternative backend model are not supported' });
    const response = generation.generateEmbeddings(payload.prompt, `${process.env.MODELS_DIR}/${model.path}`);
    return res.json(response);
  } catch (err) {
    console.error((err as Error).message);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;