import { NextResponse } from "next/server";
import mongoose from "mongoose";
import ImageKit from "imagekit";

export const runtime = "nodejs";

// ✅ Inline MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) throw new Error("❌ Missing MONGODB_URI in env");

let isConnected = false;
async function connectDB() {
  if (isConnected) return;
  await mongoose.connect(MONGODB_URI, { dbName: "csbs_sync" });
  isConnected = true;
  console.log("✅ MongoDB connected (inline)");
}

// ✅ Inline Schema
const AnnouncementSchema = new mongoose.Schema(
  {
    topic: { type: String, required: true },
    category: {
      type: String,
      enum: ["General", "Events", "Exams", "Updates", "Achievements"],
      default: "General",
    },
    details: String,
    imageUrl: String,
    addedBy: String,
  },
  { timestamps: true }
);

const Announcement =
  mongoose.models.Announcement ||
  mongoose.model("Announcement", AnnouncementSchema);

// ✅ ImageKit setup
const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});

// ✅ POST — Add Announcement
export async function POST(req) {
  try {
    await connectDB();
    const formData = await req.formData();
    const topic = formData.get("topic");
    const category = formData.get("category");
    const details = formData.get("details");
    const addedBy = formData.get("addedBy") || "Admin";
    const file = formData.get("image");

    let imageUrl = "";
    if (file) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const base64 = buffer.toString("base64");

      const uploaded = await imagekit.upload({
        file: base64,
        fileName: `announcement-${Date.now()}.jpg`,
        folder: "/announcements",
      });

      imageUrl = uploaded.url;
    }

    const ann = await Announcement.create({
      topic,
      category,
      details,
      imageUrl,
      addedBy,
    });

    return NextResponse.json({ success: true, announcement: ann });
  } catch (err) {
    console.error("❌ Add error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// ✅ GET — Fetch all
export async function GET() {
  try {
    await connectDB();
    const anns = await Announcement.find().sort({ createdAt: -1 });
    return NextResponse.json({ success: true, announcements: anns });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// ✅ DELETE — Remove
export async function DELETE(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) throw new Error("Missing announcement ID");

    await Announcement.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("❌ Delete error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
