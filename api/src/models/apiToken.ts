import mongoose from 'mongoose';

export interface IApiToken {
  _id: mongoose.Schema.Types.ObjectId;
  user: string;
  name: string;
  token: string;
  createdAt: Date;
  lastUsed: Date;
}

export default new mongoose.Schema<IApiToken>({
  user: { type: String, required: true },
  name: { type: String, required: true },
  token: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  lastUsed: { type: Date, default: Date.now },
});
