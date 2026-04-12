import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, default: null },
    avatar: { type: String, default: null },
    provider: {
      type: String,
      enum: ["local", "google", "github"],
      default: "local",
    },
    providerId: { type: String, default: null },
  },
  { timestamps: true },
);

export default mongoose.model("User", userSchema);
