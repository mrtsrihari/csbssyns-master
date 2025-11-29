import mongoose from "mongoose";
import { NextResponse } from "next/server";

async function connectDB() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI, { dbName: "csbs_sync" });
  }
}

const StudySchema = new mongoose.Schema(
  {
    subject: { type: String, required: true },
    staff: { type: String, required: true },
    topic: { type: String, required: true },
  },
  { timestamps: true }
);

const Study = mongoose.models.Study || mongoose.model("Study", StudySchema);

// ✅ DELETE /api/study/:id
export async function DELETE(req, { params }) {
  try {
    await connectDB();
    const { id } = params;
    const deleted = await Study.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json({ error: "Topic not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Deleted successfully" });
  } catch (err) {
    console.error("❌ DELETE Error:", err);
    return NextResponse.json({ error: "Failed to delete topic" }, { status: 500 });
  }
}
