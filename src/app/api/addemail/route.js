import mongoose from "mongoose";
import { NextResponse } from "next/server";

async function connectDB() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: "csbs_sync",
    });
  }
}

// IMPORTANT: Global User Schema (must match register schema)
const userSchema = new mongoose.Schema(
  {
    username: String,
    email: String,
    email1: String,   // <-- MUST BE HERE
    password: String,
    role: String,
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model("User", userSchema);

// POST /api/addemail
export async function POST(req) {
  try {
    await connectDB();

    const { email, email1 } = await req.json();

    if (!email || !email1) {
      return NextResponse.json(
        { success: false, message: "Both email and email1 are required" },
        { status: 400 }
      );
    }

    const update = await User.updateOne(
      { email },
      { $set: { email1 } }
    );

    if (update.modifiedCount === 0) {
      return NextResponse.json(
        { success: false, message: "User not found or email not updated" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Email1 added successfully",
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, message: "Server error", error: err.message },
      { status: 500 }
    );
  }
}
