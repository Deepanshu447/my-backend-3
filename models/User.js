import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    uid: { type: String, required: true, unique: true },  // Firebase UID
    email: { type: String, required: true, unique: true },
    username: { type: String, required: true }, // Display name
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
