import mongoose from "mongoose";
import Chat from "./chat";
import sharedChat from "./sharedChat";
import apiToken from "./apiToken";
import model from "./model";
import prompt from "./prompt";
import * as groq from "../utils/providers/groq";

async function main() {
  if (!process.env.DB)
    throw new Error("DB environment variable not set");
  mongoose.set('strictQuery', true);
  await mongoose.connect(process.env.DB);
  mongoose.model('Chats', Chat);
  mongoose.model('SharedChats', sharedChat);
  mongoose.model('ApiTokens', apiToken);
  mongoose.model('Models', model);
  mongoose.model('Prompts', prompt);
  
  if (process.env.GROQ_API_KEY) {
    const models = await groq.getGroqModels();
    for (const model of models) {
      await mongoose.model('Models').findOneAndUpdate({ name: model.name }, model, { upsert: true });
    }
  }
}

export default main;