import mongoose from 'mongoose';

export default new mongoose.Schema({
  name: { type: String, required: true },
  path: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  alternativeBackend: { type: Boolean, default: false },
  chatPromptTemplate: { type: String, required: false },
  parameters: { type: Object, default: {}},
});
