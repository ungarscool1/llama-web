import e, { Router } from 'express';
import mongoose from 'mongoose';
import * as yup from 'yup';
import file from '../../utils/file';
import compileTemplate from '../../utils/compileTemplate';
import { Providers } from '../../types/Generation';

var router = Router();

router.get('/', async (req, res) => {
  const models = await mongoose.model('Models').find();
  let result = [];
  models.sort((a, b) => {
    if (a.createdAt > b.createdAt) {
      return -1;
    }
    if (a.createdAt < b.createdAt) {
      return 1;
    }
    return 0;
  });
  result = models.map((model) => ({
    id: model._id,
    name: model.name,
    path: model.alternativeBackend ? model.path :
      `${process.env.MODELS_DIR}/${model.path}`,
    alternativeBackend: model.alternativeBackend,
    createdAt: model.createdAt
  }))
  res.json(result);
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
    alternativeBackend: model.alternativeBackend,
    promptTemplate: model.chatPromptTemplate
  });
});

router.delete('/:id', async (req, res) => {
  if (Object.values(Providers).includes(req.params.id.split('-')[0] as Providers)) {
    return res.json({ message: `Cannot delete this model.` }).status(400);
  }
  const model = await mongoose.model('Models').findById(req.params.id);
  if (!model) {
    return res.status(404).json({ message: 'Model not found' });
  }
  if (!model.alternativeBackend)
    await file.delete(`${process.env.MODELS_DIR}/${model.path}`);
  await mongoose.model('Models').findByIdAndDelete(req.params.id);
  res.status(200).json({ message: 'Model deleted' });
});

router.post('/', async (req, res) => {
  const schema = yup.object().shape({
    name: yup.string().required(),
    uri: yup.string().required(),
    alternativeBackend: yup.boolean().default(false),
    promptTemplate: yup.string().optional(),
    parameters: yup.object().default({}).optional()
  })
  let payload: yup.InferType<typeof schema>;
  try {
    payload = schema.validateSync(req.body)
  } catch (e) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  if (Object.values(Providers).includes(payload.name.split('-')[0] as Providers)) {
    return res.status(400).json({ message: 'Invalid model name' });
  }
  if (!payload.alternativeBackend) {
    if (!payload.promptTemplate) {
      return res.status(400).json({ message: 'Missing prompt template' });
    }
    try {
      compileTemplate(payload.promptTemplate, { system: 'system', messages: [{role: 'user', message: ''}] });
    } catch (e) {
      return res.status(400).json({ message: 'Invalid prompt template' });
    }
  }
  const ModelObj = mongoose.model('Models');
  if (!payload.alternativeBackend) {
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
      });
    res.status(202).json({ message: 'Model download in progress.' });
  } else {
    const model = new ModelObj({
      name: payload.name,
      path: payload.uri,
      alternativeBackend: true,
      parameters: payload.parameters
    });
    model.save();
    res.status(201).json({ message: 'Model created' });
  }
});

router.patch('/:id', async (req, res) => {
  const schema = yup.object().shape({
    promptTemplate: yup.string().optional(),
    parameters: yup.object().default({}).optional()
  })
  let payload: yup.InferType<typeof schema>

  try {
    payload = schema.validateSync(req.body);
  } catch (e) {
    console.error(e, req.body)
    return res.status(400).json({ message: 'Bad request' });
  }
  if (Object.values(Providers).includes(req.params.id.split('-')[0] as Providers)) {
    return res.status(400).json({ message: 'Cannot update this model.' });
  }
  try {
    if (payload.promptTemplate)
      compileTemplate(payload.promptTemplate, { system: 'system', messages: [{role: 'user', message: ''}] });
  } catch (e) {
    return res.status(400).json({ message: 'Invalid prompt template' });
  }
  try {
    await mongoose.model('Models').findOneAndUpdate({ _id: req.params.id },
      { chatPromptTemplate: payload.promptTemplate,
        parameters: Object.keys(payload.parameters).length > 0 ? payload.parameters : undefined
      });
  } catch (e) {
    console.error(e)
    return res.status(500).json({ message: 'Internal Server Error' })
  }
  res.status(200).json({ message: 'Model updated' });
})

export default router;