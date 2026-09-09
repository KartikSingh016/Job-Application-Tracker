import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    // Google's stable subject id — the only field we match on at sign-in.
    // Email is not a safe key: Google accounts can change their address.
    googleId: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    name: { type: String, trim: true },
    picture: { type: String, trim: true },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
