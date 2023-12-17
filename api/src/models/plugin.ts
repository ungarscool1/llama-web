import mongoose from 'mongoose';

export default new mongoose.Schema({
  metadata: { type: Object, required: true },
  pipeline: { type: Object, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  parameters: { type: Object, required: false },
  configuration: { type: Object, require: false }
});
