import { NextResponse } from "next/server";
import mongoose from "mongoose";
import ImageKit from "imagekit";

export const runtime = "nodejs"; // ✅ Required for MongoDB + ImageKit

// ======================
// 🔹 MongoDB Connection
// ======================
const MONGODB_URI = process.env.MONGODB_URI;
let isConnected = false;

async function connectDB() {
  if (isConnected) return;
  if (!MONGODB_URI) throw new Error("❌ MONGODB_URI not found");

  try {
    const db = await mongoose.connect(MONGODB_URI, {
      dbName: "csbs_sync",
    });
    isConnected = db.connections[0].readyState === 1;
    console.log("✅ MongoDB Connected");
  } catch (err) {
    console.error("❌ MongoDB Connection Error:", err);
  }
}

// ======================
// 🔹 Schema Definitions
// ======================
const StatusSchema = new mongoose.Schema({
  userId: String,
  username: String,
  email: String,
  state: { type: String, default: "not yet started" },
});

const WorkSchema = new mongoose.Schema(
  {
    subject: { type: String, required: true },
    work: { type: String, required: true },
    deadline: { type: String, required: true },
    fileUrl: String,
    addedBy: String,
    status: [StatusSchema],
  },
  { timestamps: true }
);

const Work = mongoose.models.Work || mongoose.model("Work", WorkSchema);

// ======================
// 🔹 ImageKit Setup
// ======================
const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});

// ======================
// 🔹 GET: Fetch all works
// ======================
export async function GET() {
  try {
    await connectDB();
    const works = await Work.find().sort({ createdAt: -1 });

    return NextResponse.json({ success: true, works }, { status: 200 });
  } catch (error) {
    console.error("❌ GET /api/works Error:", error);
    return NextResponse.json(
      { success: false, message: "Error fetching works", error: error.message },
      { status: 500 }
    );
  }
}

// ======================
// 🔹 POST: Add new work
// ======================
export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();
    const { subject, work, deadline, addedBy, fileBase64, status } = body;

    if (!subject || !work || !deadline) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    let fileUrl = "";
    if (fileBase64) {
      const upload = await imagekit.upload({
        file: fileBase64,
        fileName: `${subject}-${Date.now()}.jpg`,
        folder: "/works",
      });
      fileUrl = upload.url;
    }

    const newWork = await Work.create({
      subject,
      work,
      deadline,
      fileUrl,
      addedBy,
      status: status || [],
    });

    return NextResponse.json(
      { success: true, message: "Work added successfully", work: newWork },
      { status: 201 }
    );
  } catch (error) {
    console.error("❌ POST /api/works Error:", error);
    return NextResponse.json(
      { success: false, message: "Error creating work", error: error.message },
      { status: 500 }
    );
  }
}
