import { Router, Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { randomBytes } from 'crypto';
import { IApiToken } from '../../models/apiToken';

var router = Router();

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  await mongoose.connect(`${process.env.DB}`);
  const userTokens = (await mongoose.model('ApiTokens').find<IApiToken>({ user: req.user?.preferred_username }, '-__v')).map((token) => ({
    name: token.name,
    token: token.token.slice(0, 4) + '...' + token.token.slice(-4),
    id: token._id,
    createdAt: token.createdAt,
    lastUsed: token.lastUsed
  }));
  res.json(userTokens);
});

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  await mongoose.connect(`${process.env.DB}`);
  const ApiTokens = mongoose.model('ApiTokens');
  if (!req.body.name) {
    return res.status(400).json({
      message: 'Name is required.'
    });
  }
  const token = new ApiTokens({
    user: req.user?.preferred_username,
    name: req.body.name,
    token: `sk-${randomBytes(20).toString('hex')}`,
    createdAt: new Date(),
    lastUsed: new Date()
  });
  await token.save();
  res.json({
    message: 'Token created successfully.',
    token: token.token
  });
});

router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  if (req.params.id.length < 24) {
    return res.status(400).json({
      message: 'Invalid token id.'
    });
  }
  try {
    await mongoose.connect(`${process.env.DB}`);
    await mongoose.model('ApiTokens').findOneAndDelete({ _id: req.params.id, user: req.user?.preferred_username });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: 'Internal Server Error.'
    });
  }
  res.json({
    message: 'Token deleted successfully.'
  });
});

router.patch('/:id', async (req: Request, res: Response, next: NextFunction) => {
  if (req.params.id.length < 24) {
    return res.status(400).json({
      message: 'Invalid token id.'
    });
  }
  try {
    await mongoose.connect(`${process.env.DB}`);
    await mongoose.model('ApiTokens').findOneAndUpdate({ _id: req.params.id, user: req.user?.preferred_username }, { name: req.body.name });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: 'Internal Server Error.'
    });
  }
  res.json({
    message: 'Token updated successfully.'
  });
});

module.exports = router;