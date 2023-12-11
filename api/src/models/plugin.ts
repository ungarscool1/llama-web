import mongoose from 'mongoose';

export default new mongoose.Schema({
  name: { type: String, required: true },
  definition: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  parameters: { type: Object, required: false },
});
