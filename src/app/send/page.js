"use client";

import { useState } from "react";

export default function SendEmailForm() {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  // Preset messages
  const presets = {
    Announcement: "📢 We have an important announcement for all users.",
    Work: "💼 Please be reminded of upcoming tasks and deadlines.",
    Custom: "",
  };

  const handlePreset = (type) => {
    if (type === "Custom") {
      setMessage("");
      setSubject("");
    } else {
      setMessage(presets[type]);
      setSubject(type);
    }
  };

  const handleSend = async () => {
    if (!subject || !message) {
      setStatus("❌ Subject and message are required");
      return;
    }

    setLoading(true);
    setStatus("");

    try {
      const res = await fetch("/api/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, message }),
      });

      const data = await res.json();

      if (data.success) {
        setStatus(`✅ ${data.message}`);
        setSubject("");
        setMessage("");
        console.log("Email results:", data.results); // debug log
      } else {
        setStatus(`❌ ${data.message || "Failed to send email"}`);
      }
    } catch (err) {
      console.error(err);
      setStatus("❌ Server error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        maxWidth: "600px",
        margin: "30px auto",
        padding: "25px",
        background: "#ffffff",
        borderRadius: "12px",
        boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
        fontFamily: "Arial, sans-serif",
      }}
    >
      {/* Logo */}
      <div style={{ textAlign: "center", marginBottom: "20px" }}>
        <img
          src="https://ik.imagekit.io/9t9wl5ryo/123.jpg"
          alt="CSBS SYNC"
          style={{ width: "120px", height: "auto" }}
        />
      </div>

      <h2 style={{ textAlign: "center", color: "#1e3a8a", marginBottom: "20px" }}>
        Send Email to All Users
      </h2>

      {/* Preset Buttons */}
      <div style={{ marginBottom: "20px", textAlign: "center" }}>
        {Object.keys(presets).map((preset) => (
          <button
            key={preset}
            onClick={() => handlePreset(preset)}
            style={{
              padding: "8px 15px",
              margin: "0 5px",
              borderRadius: "6px",
              border: "none",
              background: "#1e3a8a",
              color: "#fff",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            {preset}
          </button>
        ))}
      </div>

      {/* Subject Input */}
      <input
        type="text"
        placeholder="Subject"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        style={{
          width: "100%",
          padding: "12px",
          marginBottom: "15px",
          borderRadius: "6px",
          border: "1px solid #d1d5db",
          fontSize: "15px",
        }}
      />

      {/* Message Textarea */}
      <textarea
        placeholder="Message"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={6}
        style={{
          width: "100%",
          padding: "12px",
          marginBottom: "15px",
          borderRadius: "6px",
          border: "1px solid #d1d5db",
          fontSize: "15px",
        }}
      />

      {/* Send Button */}
      <button
        onClick={handleSend}
        disabled={loading}
        style={{
          width: "100%",
          padding: "12px",
          borderRadius: "6px",
          border: "none",
          background: loading ? "#9ca3af" : "#10b981",
          color: "#fff",
          fontSize: "16px",
          cursor: loading ? "not-allowed" : "pointer",
        }}
      >
        {loading ? "Sending..." : "Send Email"}
      </button>

      {/* Status Message */}
      {status && (
        <p
          style={{
            marginTop: "15px",
            textAlign: "center",
            fontSize: "14px",
            color: status.startsWith("✅") ? "#10b981" : "#ef4444",
          }}
        >
          {status}
        </p>
      )}
    </div>
  );
}
