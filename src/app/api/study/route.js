import mongoose from "mongoose";
import { NextResponse } from "next/server";

// ✅ MongoDB Connection
async function connectDB() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: "csbs_sync",
    });
  }
}

// ✅ Schema
const StudySchema = new mongoose.Schema(
  {
    subject: { type: String, required: true },
    staff: { type: String, required: true },
    topic: { type: String, required: true },
  },
  { timestamps: true }
);

// ✅ Model
const Study = mongoose.models.Study || mongoose.model("Study", StudySchema);

// ✅ GET (Fetch all topics)
export async function GET() {
  try {
    await connectDB();
    const topics = await Study.find().sort({ createdAt: -1 });
    return NextResponse.json(topics);
  } catch (err) {
    console.error("❌ GET Error:", err);
    return NextResponse.json({ error: "Failed to fetch topics" }, { status: 500 });
  }
}

// ✅ POST (Add new topic)
export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();
    const { subject, staff, topic } = body;

    if (!subject || !staff || !topic) {
      return NextResponse.json({ error: "All fields required" }, { status: 400 });
    }

    const newTopic = new Study({ subject, staff, topic });
    const saved = await newTopic.save();
    return NextResponse.json(saved);
  } catch (err) {
    console.error("❌ POST Error:", err);
    return NextResponse.json({ error: "Failed to add topic" }, { status: 500 });
  }
}
