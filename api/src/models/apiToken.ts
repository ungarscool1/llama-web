import mongoose from 'mongoose';

export default new mongoose.Schema({
  user: { type: String, required: true },
  name: { type: String, required: true },
  token: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  lastUsed: { type: Date, default: Date.now },
});
