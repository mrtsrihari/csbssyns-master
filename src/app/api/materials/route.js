import { NextResponse } from "next/server";
import mongoose from "mongoose";

export const runtime = "nodejs";

const MONGODB_URI = process.env.MONGODB_URI;
let isConnected = false;

// 🔹 Connect MongoDB
async function connectDB() {
  if (isConnected) return;
  if (!MONGODB_URI) throw new Error("⚠️ MONGODB_URI not found in env.");
  await mongoose.connect(MONGODB_URI, { dbName: "csbs_sync" });
  isConnected = true;
  console.log("✅ MongoDB Connected (materials route)");
}

// 🔹 Schema
const materialSchema = new mongoose.Schema(
  {
    matname: String,
    subject: String,
    name: String,
    link: String,
    uploadDate: { type: Date, default: Date.now },
    format: String,
  },
  { collection: "materials" }
);

const Material =
  mongoose.models.Material || mongoose.model("Material", materialSchema);

// 🔹 GET → Fetch all materials
export async function GET() {
  try {
    await connectDB();
    const materials = await Material.find().sort({ uploadDate: -1 });
    return NextResponse.json({ success: true, data: materials });
  } catch (error) {
    console.error("❌ Fetch error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch materials" },
      { status: 500 }
    );
  }
}

// 🔹 POST → Add a new material
export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();

    const newMat = await Material.create({
      matname: body.matname,
      subject: body.subject,
      name: body.name,
      link: body.link,
      format: body.format,
      uploadDate: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: "Material added successfully",
      data: newMat,
    });
  } catch (error) {
    console.error("❌ Add error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to add material" },
      { status: 500 }
    );
  }
}
