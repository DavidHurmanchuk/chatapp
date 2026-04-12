import mongoose from "mongoose";

const reactionSchema = new mongoose.Schema(
  {
    emoji: { type: String, required: true },
    users: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { _id: false },
);

const convMessageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    senderName: { type: String, required: true },
    content: { type: String, required: true },

    reactions: [reactionSchema],

    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true },
);

convMessageSchema.index({ conversationId: 1, createdAt: -1 });

export default mongoose.model("ConversationMessage", convMessageSchema);
