import axios from 'axios';
import { IModel } from "../../models/model";
import { Message } from '../../types/Message';
import { GenerationOutput } from '../../types/Generation';
import mongoose from 'mongoose';

export async function getGroqModels(): Promise<Array<IModel>> {
  const models = await axios.get(`https://api.groq.com/openai/v1/models`, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
    },
  });
  let result = models.data.data;
  return result.map((model: any) => ({
    id: `groq-${model.id}`,
    name: `groq-${model.id}`,
    createdAt: new Date(model.created * 1000),
    alternativeBackend: true,
    parameters: {},
    path: 'groq.com',
  }));
}

export async function getGroqModel(id: string): Promise<IModel> {
  const model = await axios.get(`https://api.groq.com/openai/v1/models/${id}`, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
    },
  });
  return {
    name: `groq-${model.data.id}`,
    createdAt: new Date(model.data.created * 1000),
    alternativeBackend: true,
    parameters: {},
    path: 'groq.com',
  };
}

export async function getGroqChatCompletion(model: string, messages: Array<Message>): Promise<GenerationOutput> {
  const cancelToken = axios.CancelToken.source();
  const completion = await axios.post(`https://api.groq.com/openai/v1/chat/completions`, {
    model: model.substring(5),
    messages: messages.map(m => ({ role: m.role, content: m.message })),
    stream: true
  }, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
    },
    responseType: 'stream',
  });
  return {
    data: completion.data,
    stderr: undefined,
    kill: () => (
      cancelToken.cancel('Generation cancelled')
    )
  };
}

export async function saveGroqModels(): Promise<void> {
  const models = await getGroqModels();
  const Model = mongoose.model('Models');
  for (const model of models) {
    const existing = await
      Model.findOne({ name: model.name });
    if (!existing) {
      await Model.create(model);
    }
  }
}
