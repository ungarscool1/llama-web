import mongoose from 'mongoose';

export default new mongoose.Schema({
  name: { type: String, required: true },
  path: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  chatPromptTemplate: { type: String, required: true },
  parameters: [
    {
      temperature: { type: Number, default: 0.8 },
      topK: { type: Number, default: 40 },
      topP: { type: Number, default: 0.5 },
    },
  ],
});
