import jwt from 'jsonwebtoken';
import fs from 'fs';
import { Request, Response, NextFunction } from 'express';
import type { IUser } from './types/express';
import mongoose from 'mongoose';
import * as Sentry from '@sentry/node';

const apiTokenMiddleware = async (req: Request, reqToken: string) => {
  await mongoose.connect(`${process.env.DB}`);
  const ApiTokens = mongoose.model('ApiTokens');
  const token = await ApiTokens.findOneAndUpdate({ token: reqToken }, { lastUsed: new Date() });
  if (!token) throw new Error('Unauthorized');
  req.user = {
    preferred_username: token.user,
    username: token.user,
  } as unknown as IUser;
}

const jwtMiddleware = (req: Request, token: string) => {
  let publicKey: string;
  if (!process.env.JWT_PUBLIC_KEY) throw new Error('JWT_PUBLIC_KEY not found');
  try {
    publicKey = fs.readFileSync(process.env.JWT_PUBLIC_KEY).toString();
  } catch (err) {
    console.error(err);
    throw new Error('Internal Server Error');
  }
  try {
    req.user = jwt.verify(token, publicKey, { algorithms: ['RS256'] }) as unknown as IUser;
    req.user.username = req.user.preferred_username;
  } catch (err) {
    console.error(err)
    throw new Error('Unauthorized');
  }
}

export const middleware = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization;
  const transaction = Sentry.getActiveTransaction();
  let span: Sentry.Span|undefined;
  if (!token) return res.status(401).json({ message: 'Unauthorized' });
  if (token.split(' ')[0] !== 'Bearer') return res.status(401).json({ message: 'Unauthorized' });
  try {
    if (token.split(' ')[1].startsWith('sk-')) {
      if (transaction)
        span = transaction.startChild({ op: 'middleware', description: 'Verify authorization with API Key' });
      await apiTokenMiddleware(req, token.split(' ')[1]);
    } else {
      if (transaction)
        span = transaction.startChild({ op: 'middleware', description: 'Verify authorization with JWT' });
      jwtMiddleware(req, token.split(' ')[1]);
    }
  } catch (err) {
    console.error(err);
    if (span)
      span.finish();
    if ((err as Error).message === 'Unauthorized') return res.status(401).json({ message: 'Unauthorized' });
    return res.status(500).json({ message: 'Internal Server Error' });
  }
  if (span)
    span.finish();
  next();
}

export const anonymousMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  req.user = {
    preferred_username: 'anonymous',
    username: 'anonymous',
  } as unknown as IUser;
  next();
}