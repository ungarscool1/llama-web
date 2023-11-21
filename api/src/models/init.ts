import mongoose from "mongoose";
import Chat from "./chat";
import apiToken from "./apiToken";
import model from "./model";

async function main() {
  if (!process.env.DB)
    throw new Error("DB environment variable not set");
  mongoose.set('strictQuery', true);
  await mongoose.connect(process.env.DB);
  mongoose.model('Chats', Chat);
  mongoose.model('ApiTokens', apiToken);
  mongoose.model('Models', model);
}

export default main;