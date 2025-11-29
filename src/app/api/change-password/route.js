import { NextResponse } from "next/server";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

export const runtime = "nodejs";

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI;
let isConnected = false;

async function connectDB() {
  if (isConnected) return;
  await mongoose.connect(MONGODB_URI, { dbName: "csbs_sync" });
  isConnected = true;
}

// User Schema
const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  email1: String,
  password: String,
});

const User = mongoose.models.User || mongoose.model("User", userSchema);

// POST → Change Password (by email)
export async function POST(req) {
  try {
    await connectDB();

    const { email, currentPassword, newPassword } = await req.json();
    const user = await User.findOne({ email });

    if (!user)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match)
      return NextResponse.json({ error: "Incorrect current password" }, { status: 400 });

    const hashed = await bcrypt.hash(newPassword, 10);
    user.password = hashed;
    await user.save();

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Password change error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
