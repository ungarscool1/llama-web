import mongoose from 'mongoose';

export interface IPrompt {
  _id: mongoose.Schema.Types.ObjectId;
  user: string;
  prompt: string;
}

export default new mongoose.Schema<IPrompt>({
  user: { type: String, required: true },
  prompt: { type: String, required: true },
});
