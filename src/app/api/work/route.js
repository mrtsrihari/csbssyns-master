import { NextResponse } from "next/server";
import mongoose from "mongoose";

// ✅ Inline MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) throw new Error("Missing MONGODB_URI");

let isConnected = false;
async function connectDB() {
  if (isConnected) return;
  await mongoose.connect(MONGODB_URI, { dbName: "csbs_sync" });
  isConnected = true;
}

// ✅ Inline Schema
const statusSchema = new mongoose.Schema({
  userId: String,
  username: String,
  email: String,
  state: {
    type: String,
    enum: ["completed", "doing", "not yet started"],
    default: "not yet started",
  },
});

const workSchema = new mongoose.Schema(
  {
    subject: String,
    work: String,
    deadline: String,
    fileUrl: String,
    addedBy: String,
    status: [statusSchema],
  },
  { timestamps: true }
);

const Work = mongoose.models.Work || mongoose.model("Work", workSchema);

// ✅ GET all works
export async function GET() {
  try {
    await connectDB();
    const works = await Work.find().sort({ createdAt: -1 });
    return NextResponse.json({ success: true, works });
  } catch (err) {
    console.error("GET Error:", err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

// ✅ DELETE work
export async function DELETE(req) {
  try {
    const { id } = await req.json();
    await connectDB();
    await Work.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE Error:", err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
