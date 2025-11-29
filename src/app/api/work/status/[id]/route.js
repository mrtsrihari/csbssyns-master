import { NextResponse } from "next/server";
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;
let isConnected = false;
async function connectDB() {
  if (isConnected) return;
  await mongoose.connect(MONGODB_URI, { dbName: "csbs_sync" });
  isConnected = true;
}

const statusSchema = new mongoose.Schema({
  userId: String,
  username: String,
  email: String,
  state: String,
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

export async function POST(req, { params }) {
  try {
    const { id } = params;
    const { userId, username, email, state } = await req.json();
    if (!userId || !state)
      return NextResponse.json({ success: false, message: "Missing user info" });

    await connectDB();
    const work = await Work.findById(id);
    if (!work) return NextResponse.json({ success: false, message: "Work not found" });

    const existing = work.status.find((s) => s.userId === userId);
    if (existing) existing.state = state;
    else work.status.push({ userId, username, email, state });

    await work.save();
    return NextResponse.json({ success: true, work });
  } catch (err) {
    console.error("Status Error:", err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
