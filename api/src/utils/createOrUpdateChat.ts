import mongoose from "mongoose";

export async function createOrUpdateChat(
  messages: Array<{ role: string; message: string }>,
  model?: string,
  id?: string,
  user?: string,
): Promise<string> {
  const Chat = mongoose.model("Chats");
  if (id) {
    await Chat.findByIdAndUpdate(id, {
      $push: {
        messages: {
          $each: messages
        }
      }
    });
    return '';
  }
  const newChat = new Chat({
    user,
    messages,
    time: new Date(),
    model: model ? await mongoose.model("Models").findOne({ name: model }) : undefined
  });
  await newChat.save();
  return newChat._id.toString();
}