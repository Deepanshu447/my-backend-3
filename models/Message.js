import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    senderUid: { type: String, required: true },
    receiverUid: { type: String, required: true },
    text: { type: String, required: true },
    timestamp: {
      type: Date,
      default: Date.now, // <-- auto add time when saved
    }
  },
);

export default mongoose.model("Message", messageSchema);
