"use client";
import { useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";

export default function UploadPage() {
  const [username, setUsername] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [file, setFile] = useState(null);
  const [materialName, setMaterialName] = useState("");
  const [subject, setSubject] = useState("");
  const [uploading, setUploading] = useState(false);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openSubject, setOpenSubject] = useState(null);

  // ✅ Fetch Materials
  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/materials");
      const data = await res.json();
      setMaterials(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      console.error("Error fetching materials:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, []);

  // ✅ Decode JWT
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUsername(decoded?.username || "");
        setIsAdmin(decoded?.role === "admin");
      } catch (err) {
        console.error("Invalid token:", err);
      }
    }
  }, []);

  // ✅ Upload New Material
  const handleUpload = async () => {
    if (!file || !materialName || !subject) {
      alert("Please fill all fields and select a file!");
      return;
    }
    if (!username) {
      alert("You must log in first!");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("username", username);
    formData.append("materialName", materialName);
    formData.append("subject", subject);
    formData.append("uploadDate", new Date().toISOString());

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setMaterialName("");
        setSubject("");
        setFile(null);
        fetchMaterials();
      } else {
        alert(data.message || "Upload failed!");
      }
    } catch (err) {
      console.error("Upload error:", err);
      alert("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  // ✅ Delete Material (Admin only)
  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this material?")) return;
    try {
      const res = await fetch("/api/materials/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (data.success) {
        alert("✅ Material deleted successfully!");
        fetchMaterials();
      } else {
        alert("⚠️ " + (data.message || "Failed to delete"));
      }
    } catch (err) {
      console.error("Delete error:", err);
      alert("❌ Server error while deleting");
    }
  };

  // ✅ Open Material
  const handleViewClick = (url) => {
    if (!url) {
      alert("No valid link found!");
      return;
    }
    try {
      const finalUrl = url.startsWith("http") ? url : `https://${url}`;
      window.open(finalUrl, "_blank", "noopener,noreferrer");
    } catch (err) {
      console.error("Invalid URL:", err);
    }
  };

  // ✅ Group materials by subject
  const grouped = materials.reduce((acc, mat) => {
    const subj = mat.subject || "Uncategorized";
    if (!acc[subj]) acc[subj] = [];
    acc[subj].push(mat);
    return acc;
  }, {});

  // ✅ UI Rendering
  return (
    <div className="min-h-screen w-full flex flex-col items-center py-10 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-100">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
          CSBS Study Materials 📚
        </h1>
        <p className="text-gray-600 mt-2">
          {username ? `Welcome, ${username} 👋` : "Please log in first."}
        </p>
      </div>

      {/* Admin Upload Section */}
      {isAdmin && (
        <div className="w-[90%] max-w-xl bg-white/80 shadow p-8 rounded-xl border border-gray-200 mb-10">
          <h2 className="text-xl font-semibold text-blue-700 mb-4 text-center">
            Upload New Material
          </h2>

          <input
            type="text"
            placeholder="Material name"
            value={materialName}
            onChange={(e) => setMaterialName(e.target.value)}
            className="w-full mb-3 p-2 border border-gray-300 rounded-md"
          />
          <input
            type="text"
            placeholder="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full mb-3 p-2 border border-gray-300 rounded-md"
          />
          <input
            type="file"
            onChange={(e) => setFile(e.target.files[0])}
            className="w-full mb-4 border border-gray-300 rounded-md p-2 bg-white"
          />

          <button
            onClick={handleUpload}
            disabled={uploading}
            className={`w-full py-3 font-semibold rounded-md text-white transition-all ${
              uploading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90"
            }`}
          >
            {uploading ? "Uploading..." : "🚀 Upload Material"}
          </button>
        </div>
      )}

      {/* Materials List */}
      <div className="w-[95%] max-w-6xl bg-white shadow p-8 rounded-xl border border-gray-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-blue-700">Available Materials</h2>
          <button
            onClick={fetchMaterials}
            className="text-sm bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition"
          >
            🔄 Refresh
          </button>
        </div>

        {loading ? (
          <p className="text-center text-gray-500 animate-pulse">Loading...</p>
        ) : materials.length > 0 ? (
          <div className="space-y-4">
            {Object.keys(grouped).map((subject) => (
              <div
                key={subject}
                className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100 rounded-xl shadow-sm"
              >
                {/* Subject Header */}
                <div
                  onClick={() =>
                    setOpenSubject(openSubject === subject ? null : subject)
                  }
                  className="cursor-pointer flex justify-between items-center px-6 py-4"
                >
                  <h3 className="text-lg font-semibold text-blue-700">
                    📘 {subject}
                  </h3>
                  <span className="text-gray-500">
                    {openSubject === subject ? "▲" : "▼"}
                  </span>
                </div>

                {/* Dropdown Material List */}
                {openSubject === subject && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-6 border-t border-blue-100 bg-white rounded-b-xl">
                    {grouped[subject].map((mat) => (
                      <div
                        key={mat._id}
                        className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all"
                      >
                        <h4 className="text-base font-semibold text-gray-800 mb-1">
                          {mat.matname}
                        </h4>
                        <p className="text-xs text-gray-500 mb-1">
                          Uploaded:{" "}
                          {mat.uploadDate
                            ? new Date(mat.uploadDate).toLocaleDateString()
                            : "N/A"}
                        </p>
                        <p className="text-xs text-gray-500 mb-2">
                          By: {mat.name || "Unknown"}
                        </p>

                        <img
                          src={
                            ["png", "jpg", "jpeg"].includes(
                              mat.format?.toLowerCase?.() || ""
                            )
                              ? "https://img.icons8.com/fluency/96/image.png"
                              : "https://img.icons8.com/fluency/96/document.png"
                          }
                          alt="icon"
                          className="w-12 h-12 mx-auto mb-3"
                        />

                        <button
                          onClick={() => handleViewClick(mat.link)}
                          className="w-full py-2 rounded-md bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-semibold hover:opacity-90 transition"
                        >
                          🔗 View / Download
                        </button>

                        {isAdmin && (
                          <button
                            onClick={() => handleDelete(mat._id)}
                            className="mt-2 w-full py-2 rounded-md bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition"
                          >
                            🗑 Delete
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500">No materials available yet.</p>
        )}
      </div>
    </div>
  );
}
