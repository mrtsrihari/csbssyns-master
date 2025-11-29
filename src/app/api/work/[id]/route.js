import { NextResponse } from "next/server";
import mongoose from "mongoose";

export const runtime = "nodejs";

// ✅ DB Connection
async function connectDB() {
  if (mongoose.connection.readyState >= 1) return;
  await mongoose.connect(process.env.MONGODB_URI, { dbName: "csbs_sync" });
}

// ✅ Schema & Model
const StatusSchema = new mongoose.Schema({
  userId: String,
  username: String,
  email: String,
  state: { type: String, default: "not yet started" },
});

const WorkSchema = new mongoose.Schema(
  {
    subject: String,
    work: String,
    deadline: String,
    fileUrl: String,
    addedBy: String,
    status: [StatusSchema],
  },
  { timestamps: true }
);

const Work = mongoose.models.Work || mongoose.model("Work", WorkSchema);

// ✅ GET One Work
export async function GET(_, { params }) {
  try {
    await connectDB();
    const work = await Work.findById(params.id);
    if (!work) return NextResponse.json({ message: "Not found" }, { status: 404 });
    return NextResponse.json(work);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ✅ DELETE One Work
export async function DELETE(_, { params }) {
  try {
    await connectDB();
    await Work.findByIdAndDelete(params.id);
    return NextResponse.json({ message: "Deleted successfully" });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
