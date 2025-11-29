import mongoose from "mongoose";
import { NextResponse } from "next/server";
import fetch from "node-fetch";

// Connect to MongoDB
async function connectDB() {
  if (mongoose.connection.readyState === 0) {
    try {
      await mongoose.connect(process.env.MONGODB_URI, {
        dbName: "csbs_sync",
      });
      console.log("✅ MongoDB connected");
    } catch (err) {
      console.error("❌ MongoDB connection error:", err);
    }
  }
}

// User schema
const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    email1: String,
    password: { type: String, required: true },
    role: { type: String, default: "user" },
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model("User", userSchema);

// POST /api/send-email
export async function POST(req) {
  try {
    await connectDB();

    const { subject, message } = await req.json();

    if (!subject || !message) {
      return NextResponse.json(
        { success: false, message: "Subject and message are required" },
        { status: 400 }
      );
    }

    // Find all users with email1
    const users = await User.find({ email1: { $exists: true, $ne: "" } });

    if (!users.length) {
      return NextResponse.json({
        success: true,
        message: "No users with email1 found, no emails sent",
      });
    }

    // Check API key
    if (!process.env.BREVO_API_KEY) {
      console.error("❌ Brevo API key is missing!");
      return NextResponse.json({
        success: false,
        message: "Brevo API key is missing in environment variables",
      });
    }

    // Send emails in parallel
    const sendPromises = users.map(async (user) => {
      const body = {
        sender: { name: "CSBS SYNC", email: "csbssync@gmail.com" }, // must be verified in Brevo
        to: [{ email: user.email1 }],
        subject,
        htmlContent: `
          <div style="width:100%; background:#f3f4f6; padding:20px; font-family:Arial, sans-serif;">
  <!-- Centered container -->
  <table align="center" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px; background:#ffffff; border-radius:12px; overflow:hidden; border:1px solid #e5e7eb;">
    
    <!-- Banner / Logo -->
    <tr>
      <td style="background:#1e3a8a; text-align:center; padding:25px;">
        <img src="https://ik.imagekit.io/9t9wl5ryo/123.jpg" alt="CSBS SYNC" width="140" style="display:block; margin:auto;">
      </td>
    </tr>

    <!-- Message header -->
    <tr>
      <td style="padding:25px;">
        <h2 style="margin:0 0 15px; font-size:24px; color:#111827; text-align:center;">📩 You Have a New Message</h2>
        <p style="font-size:16px; color:#374151; line-height:1.6; text-align:center;">
          Hello, CSBS SYNC has sent you a message. See the details below:
        </p>

        <!-- Message card -->
        <div style="background:#f9fafb; padding:20px; border-radius:10px; border:1px solid #e5e7eb; margin-top:20px; font-size:15px; color:#111827; line-height:1.5; word-break:break-word;">
          ${message}
        </div>
      </td>
    </tr>

    <!-- Sender info -->
    <tr>
      <td style="padding:20px; background:#eef2ff; border-top:1px solid #e5e7eb;">
        <h3 style="margin:0 0 8px; font-size:16px; color:#1e3a8a;">Sender Info</h3>
        <p style="margin:0; font-size:14px; color:#374151;">
          CSBS SYNC Team<br>
          <a href="mailto:csbssync@gmail.com" style="color:#1e3a8a; text-decoration:none;">csbssync@gmail.com</a>
        </p>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="padding:15px; text-align:center; font-size:12px; color:#6b7280;">
        &copy; 2025 CSBS SYNC. All rights reserved.<br>
        <span style="color:#9ca3af;">This is an automated message. Please do not reply.</span>
      </td>
    </tr>
  </table>
</div>

        `,
      };

      try {
        const res = await fetch("https://api.brevo.com/v3/smtp/email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "api-key": process.env.BREVO_API_KEY,
          },
          body: JSON.stringify(body),
        });

        const result = await res.json();
        console.log(`Email sent to ${user.email1}:`, result);
        return { email: user.email1, result };
      } catch (err) {
        console.error(`Failed to send to ${user.email1}:`, err);
        return { email: user.email1, error: err.message };
      }
    });

    const results = await Promise.all(sendPromises);

    return NextResponse.json({
      success: true,
      message: `Attempted to send emails to ${results.length} users`,
      results,
    });
  } catch (err) {
    console.error("❌ Send email error:", err);
    return NextResponse.json(
      { success: false, message: "Failed to send emails", error: err.message },
      { status: 500 }
    );
  }
}
