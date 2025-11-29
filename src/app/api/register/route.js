import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

// ✅ MongoDB Connection
async function connectDB() {
  if (mongoose.connection.readyState === 0) {
    try {
      await mongoose.connect(process.env.MONGODB_URI, {
        dbName: "csbs_sync",
      });
      console.log("✅ MongoDB connected (register)");
    } catch (err) {
      console.error("❌ MongoDB connection error:", err);
    }
  }
}

// ✅ User Schema
const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    email1: String,
    password: { type: String, required: true },
    role: { type: String, default: "user" }, // admin or user
  },
  { timestamps: true }
);

// Prevent model overwrite
const User = mongoose.models.User || mongoose.model("User", userSchema);

// ✅ POST /api/register
export async function POST(req) {
  try {
    await connectDB();

    const body = await req.json();
    const { username, email, password, role } = body;

    // Validate inputs
    if (!username || !email || !password) {
      return NextResponse.json(
        { success: false, message: "All fields are required" },
        { status: 400 }
      );
    }

    // Check existing user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { success: false, message: "User already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUser = await User.create({
      username,
      email,
      password: hashedPassword,
      role: role || "user",
    });

    console.log(`✅ User registered: ${newUser.username}`);

    return NextResponse.json(
      {
        success: true,
        message: "User registered successfully",
        user: {
          id: newUser._id,
          username: newUser.username,
          email: newUser.email,
          role: newUser.role,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("❌ Registration error:", err);
    return NextResponse.json(
      { success: false, message: "Registration failed", error: err.message },
      { status: 500 }
    );
  }
}
