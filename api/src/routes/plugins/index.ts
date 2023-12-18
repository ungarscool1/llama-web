import e, { Router } from 'express';
import mongoose from 'mongoose';
import * as yup from 'yup';

var router = Router();

router.get('/', async (req, res) => {
  const plugins = await mongoose.model('Plugins').find();
  plugins.sort((a, b) => {
    if (a.createdAt > b.createdAt) {
      return 1;
    }
    if (a.createdAt < b.createdAt) {
      return -1;
    }
    return 0;
  });
  res.json(plugins.map((plugin) => ({
    id: plugin._id,
    name: plugin.metadata.name,
    version: plugin.metadata.version,
    author: plugin.metadata.author,
    createdAt: plugin.createdAt,
    updatedAt: plugin.updatedAt
  })));
});

router.get('/:id', async (req, res) => {
  const plugin = await mongoose.model('Plugins').findById(req.params.id);
  if (!plugin) {
    return res.status(404).json({ message: 'Model not found' });
  }
  res.json({
    id: plugin._id,
    name: plugin.name,
    metadata: plugin.metadata,
    pipeline: plugin.pipeline,
    parameters: plugin.parameters,
    configuration: plugin.configuration,
    createdAt: plugin.createdAt,
    updatedAt: plugin.updatedAt
  });
});

router.delete('/:id', async (req, res) => {
  try {
    const plugin = await mongoose.model('Plugins').findByIdAndDelete(req.params.id);
    if (!plugin) {
      return res.status(404).json({ message: 'Plugin not found' });
    }
  } catch (e) {
    return res.status(500).json({ message: 'Internal Server Error' });
  }
  res.status(200).json({ message: 'Plugin deleted' });
});

router.post('/', async (req, res) => {
  const schema = yup.object().shape({
    metadata: yup.object().shape({
      name: yup.string().required(),
      description: yup.string().required(),
      version: yup.string().required(),
      author: yup.string().required(),
    }).required(),
    parameters: yup.object().optional(),
    configuration: yup.object().optional(),
    pipeline: yup.array().of(yup.object().shape({
      id: yup.string().required(),
      type: yup.string().required(),
      input: yup.string().optional(),
      output: yup.string().optional(),
      script: yup.string().optional(),
    })).required(),
  })
  let payload: yup.InferType<typeof schema>;
  try {
    payload = schema.validateSync(req.body)
  } catch (e) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  // check 
  const PluginObj = mongoose.model('Plugins');
  const plugin = new PluginObj({
    metadata: payload.metadata,
    pipeline: payload.pipeline,
    parameters: payload.parameters,
    configuration: payload.configuration
  });
  plugin.save();
  res.status(201).json({ message: `Plugin ${payload.metadata.name} created` });
});

router.patch('/:id', async (req, res) => {
  const schema = yup.object().shape({
    metadata: yup.object().shape({
      name: yup.string().required(),
      description: yup.string().required(),
      version: yup.string().required(),
      author: yup.string().required(),
    }).required(),
    parameters: yup.object().optional(),
    configuration: yup.object().optional(),
    pipeline: yup.array().of(yup.object().shape({
      id: yup.string().required(),
      type: yup.string().required(),
      input: yup.string().optional(),
      output: yup.string().optional(),
      script: yup.string().optional(),
    })).required(),
  })
  let payload: yup.InferType<typeof schema>

  try {
    payload = schema.validateSync(req.body);
  } catch (e) {
    console.error(e, req.body)
    return res.status(400).json({ message: 'Bad request' });
  }
  try {
    await mongoose.model('Plugins').findOneAndUpdate({ _id: req.params.id }, {
      metadata: payload.metadata,
      pipeline: payload.pipeline,
      parameters: payload.parameters,
      configuration: payload.configuration
    });
  } catch (e) {
    console.error(e)
    return res.status(500).json({ message: 'Internal Server Error' })
  }
  res.status(200).json({ message: 'Plugin updated' });
})

export default router;