import { Router } from 'express';
import mongoose from 'mongoose';
import * as yup from 'yup';
import file from '../../utils/file';

var router = Router();

router.get('/', async (req, res) => {
  const models = await mongoose.model('Models').find();
  models.sort((a, b) => {
    if (a.createdAt > b.createdAt) {
      return 1;
    }
    if (a.createdAt < b.createdAt) {
      return -1;
    }
    return 0;
  });
  res.json(models.map((model) => ({
    id: model._id,
    name: model.name,
    path: `${process.env.MODELS_DIR}/${model.path}`,
    createdAt: model.createdAt
  })));
});

router.get('/:id', async (req, res) => {
  const model = await mongoose.model('Models').findById(req.params.id);
  if (!model) {
    return res.status(404).json({ message: 'Model not found' });
  }
  res.json({
    id: model._id,
    name: model.name,
    createdAt: model.createdAt,
    parameters: model.parameters,
    promptTemplate: model.chatPromptTemplate
  });
});

router.delete('/:id', async (req, res) => {
  const model = await mongoose.model('Models').findById(req.params.id);
  if (!model) {
    return res.status(404).json({ message: 'Model not found' });
  }
  await file.delete(`${process.env.MODELS_DIR}/${model.path}`);
  await mongoose.model('Models').findByIdAndDelete(req.params.id);
  res.status(200).json({ message: 'Model deleted' });
});

router.post('/', async (req, res) => {
  const schema = yup.object().shape({
    name: yup.string().required(),
    uri: yup.string().required(),
    promptTemplate: yup.string().required()
  })
  let payload: yup.InferType<typeof schema>;
  try {
    payload = schema.validateSync(req.body)
  } catch (e) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  const ModelObj = mongoose.model('Models');
  const fileName = encodeURI(payload.name);
  file.download(payload.uri, `${process.env.MODELS_DIR}/${fileName}`)
    .then(() => {
      const model = new ModelObj({
        name: payload.name,
        path: `${fileName}`,
        chatPromptTemplate: payload.promptTemplate,
        parameters: req.body.parameters
      });
      model.save();
    })
    res.status(202).json({ message: 'Model download in progress.' });
});

router.patch('/:id', async (req, res) => {
  const schema = yup.object().shape({
    promptTemplate: yup.string().required()
  })
  let payload: yup.InferType<typeof schema>

  try {
    payload = schema.validateSync(req.body);
  } catch (e) {
    return res.status(400).json({ message: 'Bad request' });
  }
  try {
    await mongoose.model('ApiTokens').findOneAndUpdate({ _id: req.params.id, user: req.user?.preferred_username }, { name: req.body.name });
  } catch (e) {
    console.error(e)
    return res.status(500).json({ message: 'Internal Server Error' })
  }
})

export default router;