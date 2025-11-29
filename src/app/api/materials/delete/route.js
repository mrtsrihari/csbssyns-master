import { NextResponse } from "next/server";
import mongoose from "mongoose";

export const runtime = "nodejs";

const MONGODB_URI = process.env.MONGODB_URI;
let isConnected = false;

async function connectDB() {
  if (isConnected) return;
  if (!MONGODB_URI) throw new Error("MONGODB_URI missing");
  await mongoose.connect(MONGODB_URI, { dbName: "csbs_sync" });
  isConnected = true;
}

const materialSchema = new mongoose.Schema(
  {
    matname: String,
    subject: String,
    name: String,
    link: String,
    uploadDate: Date,
    format: String,
  },
  { collection: "materials" }
);

const Material =
  mongoose.models.Material || mongoose.model("Material", materialSchema);

export async function POST(req) {
  try {
    await connectDB();
    const { id } = await req.json();

    if (!id)
      return NextResponse.json({ success: false, message: "Missing ID" }, { status: 400 });

    const deleted = await Material.findByIdAndDelete(id);
    if (!deleted)
      return NextResponse.json({ success: false, message: "Not found" }, { status: 404 });

    return NextResponse.json({ success: true, message: "Material deleted" });
  } catch (err) {
    console.error("❌ Delete error:", err);
    return NextResponse.json(
      { success: false, message: "Failed to delete" },
      { status: 500 }
    );
  }
}
