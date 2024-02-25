import mongoose from 'mongoose';
import { IChat } from './chat';

export interface ISharedChat extends IChat {
  visibility: 'public' | 'authenticated';
}

export default new mongoose.Schema<ISharedChat>({
  time: { type: Date, default: Date.now },
  user: { type: String, required: true },
  messages: [
    {
      role: { type: String, required: true },
      message: { type: String, required: true },
    },
  ],
  model: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Models',
    required: true,
  },
  visibility: {
    type: String,
    enum: ['public', 'authenticated'],
    required: true,
  },
});

