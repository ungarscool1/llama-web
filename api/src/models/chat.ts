import { Role } from '../types/Message';
import mongoose from 'mongoose';

export interface IChat {
  _id: mongoose.Schema.Types.ObjectId;
  time: Date;
  user: string;
  messages: {
    role: Role;
    message: string;
  }[];
  model: mongoose.Schema.Types.ObjectId;
}

export default new mongoose.Schema<IChat>({
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
  }
});

