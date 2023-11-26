import mongoose from 'mongoose';

export default new mongoose.Schema({
  time: { type: Date, default: Date.now },
  user: { type: String, required: true },
  messages: [
    {
      isBot: { type: Boolean, default: false },
      message: { type: String, required: true },
    },
  ],
  model: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Models',
    required: true,
  }
});

