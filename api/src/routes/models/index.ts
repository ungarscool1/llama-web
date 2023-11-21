import { Router } from 'express';
import mongoose from 'mongoose';
import fs from 'fs';
import http from 'http';

var router = Router();

router.get('/', async (req, res) => {
  const models = await mongoose.model('Models').find();
  models.sort((a, b) => {
    if (a.createdAt > b.createdAt) {
      return -1;
    }
    if (a.createdAt < b.createdAt) {
      return 1;
    }
    return 0;
  });
  res.json(models.map((model) => ({
    id: model._id,
    name: model.name,
    createdAt: model.createdAt
  })));
});

router.get('/:id', async (req, res) => {
  const model = await mongoose.model('Models').findById(req.params.id);
  res.json({
    id: model._id,
    name: model.name,
    createdAt: model.createdAt,
    parameters: model.parameters,
    chatPromptTemplate: model.chatPromptTemplate
  });
});

router.delete('/:id', async (req, res) => {
  // TODO: Delete model files
  await mongoose.model('Models').findByIdAndDelete(req.params.id);
  res.status(200).json({ message: 'Model deleted' });
});

router.post('/', async (req, res) => {
  if (!req.body.name || !req.body.uri || !req.body.promptTemplate) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  const ModelObj = mongoose.model('Models');
  // download model files
  const fileName = encodeURI(req.body.name);
  const file = fs.createWriteStream(`${process.env.MODELS_DIR}/${fileName}`);
  const downloadRequest = http.get(req.body.uri, (response) => {
    response.pipe(file);
    file.on('finish', async function () {
      file.close();
      const model = new ModelObj({
        name: req.body.name,
        path: `${process.env.MODELS_DIR}/${fileName}`,
        chatPromptTemplate: req.body.promptTemplate,
        parameters: req.body.parameters
      });
      await model.save();
      res.status(201).json({ message: 'Model created' });
    });
  });
  downloadRequest.on('error', function (err) {
    fs.unlink(`${process.env.MODELS_DIR}/${fileName}`, () => { });
    res.status(500).json({ message: 'Failed to download model' });
  });
});

export default router;