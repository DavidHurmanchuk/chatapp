import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["dm", "group", "ai", "group_ai"],
      required: true,
    },
    name: { type: String, default: null },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    aiTrigger: { type: String, default: "/groq" },

    hiddenBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    unreadCount: { type: Map, of: Number, default: {} },

    last_message: { type: String, default: null },
    last_at: { type: Date, default: null },
  },
  { timestamps: true },
);

export default mongoose.model("Conversation", conversationSchema);
