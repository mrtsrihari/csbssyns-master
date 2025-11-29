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

export async function POST(req) {
  try {
    const { subject, work, deadline, fileUrl, addedBy } = await req.json();
    if (!subject || !work || !deadline)
      return NextResponse.json({ success: false, message: "Missing fields" });

    await connectDB();
    const newWork = await Work.create({
      subject,
      work,
      deadline,
      fileUrl,
      addedBy,
      status: [],
    });

    return NextResponse.json({ success: true, work: newWork });
  } catch (err) {
    console.error("Add Error:", err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
