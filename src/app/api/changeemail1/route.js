import mongoose from "mongoose";
import { NextResponse } from "next/server";

async function connectDB() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: "csbs_sync",
    });
  }
}

// User Schema (same as registration)
const userSchema = new mongoose.Schema(
  {
    username: String,
    email: String,
    email1: String,
    password: String,
    role: String,
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model("User", userSchema);

// 🔹 PATCH — Update secondary email
export async function PATCH(req) {
  try {
    await connectDB();

    const { email, email1 } = await req.json();

    if (!email || !email1) {
      return NextResponse.json(
        { success: false, message: "Primary email and new email1 are required" },
        { status: 400 }
      );
    }

    const update = await User.updateOne(
      { email },
      { $set: { email1 } }
    );

    if (update.matchedCount === 0) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    if (update.modifiedCount === 0) {
      return NextResponse.json(
        { success: false, message: "Email1 was not updated" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Secondary email updated successfully",
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, message: "Server error", error: err.message },
      { status: 500 }
    );
  }
}
