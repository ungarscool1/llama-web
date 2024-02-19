import mongoose from 'mongoose';

export interface IModel {
  name: string;
  path: string;
  createdAt: Date;
  alternativeBackend: boolean;
  chatPromptTemplate?: string;
  parameters: Record<string, unknown>;
}

export default new mongoose.Schema<IModel>({
  name: { type: String, required: true },
  path: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  alternativeBackend: { type: Boolean, default: false },
  chatPromptTemplate: { type: String, required: false },
  parameters: { type: Object, default: {}},
});
