import { NextResponse } from "next/server";
import ImageKit from "imagekit";

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});

export async function POST(req) {
  try {
    const data = await req.formData();
    const file = data.get("file");
    if (!file) return NextResponse.json({ success: false, message: "No file" });

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const uploadRes = await imagekit.upload({ file: buffer, fileName: file.name });

    return NextResponse.json({ success: true, url: uploadRes.url });
  } catch (err) {
    console.error("Upload Error:", err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
