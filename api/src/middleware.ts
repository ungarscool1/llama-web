import jwt from 'jsonwebtoken';
import fs from 'fs';
import { Request, Response, NextFunction } from 'express';
import type { IUser } from './types/express';

export const middleware = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization;
  let publicKey: string;
  if (!token) return res.status(401).json({ message: 'Unauthorized' });
  if (token.split(' ')[0] !== 'Bearer') return res.status(401).json({ message: 'Unauthorized' });
  if (!process.env.JWT_PUBLIC_KEY) return res.status(500).json({ message: 'Internal Server Error', error: process.env.NODE_ENV === 'development' ? 'JWT_PUBLIC_KEY not found' : undefined });
  try {
    publicKey = fs.readFileSync(process.env.JWT_PUBLIC_KEY).toString();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
  try {
    req.user = jwt.verify(token.split(' ')[1], publicKey, { algorithms: ['RS256'] }) as unknown as IUser;
  } catch (err) {
    console.error(err)
    return res.status(401).json({ message: 'Unauthorized' });
  }
  next();
}