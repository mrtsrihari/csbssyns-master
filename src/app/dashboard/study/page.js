"use client";
import { useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import { ChevronDown, ChevronUp, Trash2, Plus, Calendar } from "lucide-react";

export default function StudyPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [open, setOpen] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [topics, setTopics] = useState([]);
  const [showTimetable, setShowTimetable] = useState(false);

  // ✅ Subject + Staff data
  const subjects = [
    { name: "Linear Algebra", staff: "Ms.M.M.Shalini" },
    { name: "Problem solving using c", staff: "Dr.D.Ramya" },
    { name: "Business Communication and value Science", staff: "Dr.S.Kavitha" },
    { name: "Electronics And Microprocessor", staff: "Dr.M.Geetha" },
    { name: "Physics For Information Science ", staff: "Dr.A.Sivakami" },
  ];

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setIsAdmin(decoded.role === "admin");
      } catch {
        console.error("Invalid token");
      }
    }
    fetchTopics();
  }, []);

  // ✅ Fetch topics from backend
  const fetchTopics = async () => {
    try {
      const res = await fetch("/api/study");
      if (!res.ok) throw new Error("Failed to fetch topics");
      const data = await res.json();
      setTopics(data);
    } catch (err) {
      console.error(err);
      // fallback data
      setTopics([
        { _id: "1", subject: "Mathematics", staff: "Dr. S. Ramya", topic: "Calculus" },
        { _id: "2", subject: "Mathematics", staff: "Dr. S. Ramya", topic: "Limits" },
        { _id: "3", subject: "Database Systems", staff: "Dr. N. Priya", topic: "SQL Basics" },
      ]);
    }
  };

  const handleAddTopic = async () => {
    if (!selectedSubject || !topic.trim()) return alert("Please fill all fields!");
    const staffName = subjects.find((s) => s.name === selectedSubject)?.staff || "";
    const newEntry = { subject: selectedSubject, staff: staffName, topic };

    try {
      const res = await fetch("/api/study", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newEntry),
      });
      if (res.ok) {
        const saved = await res.json();
        setTopics([...topics, saved]);
        setTopic("");
        setSelectedSubject("");
      } else throw new Error("Failed to add topic");
    } catch (err) {
      console.error(err);
      alert("Error adding topic");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this topic?")) return;
    try {
      const res = await fetch(`/api/study/${id}`, { method: "DELETE" });
      if (res.ok) setTopics(topics.filter((t) => t._id !== id));
    } catch (err) {
      console.error(err);
      alert("Delete failed");
    }
  };

  const toggleDropdown = (index) => setOpen(open === index ? null : index);
  const grouped = subjects.map((subject) => ({
    ...subject,
    topics: topics.filter((t) => t.subject === subject.name),
  }));

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const timetable = [
    ["LA", "BCVS", "EMP LAB", "EMP LAB", "PSC LAB", "PSC LAB", "PSC LAB"],
    ["PIS", "LA", "BCVS", "EMP", "EP LAB", "EP LAB", "LA (T)"],
    ["PSC", "PSC LAB", "PSC LAB", "PSC LAB", "EMP", "PIS", "BCVS"],
    ["BCVS LAB", "BCVS LAB", "PIS LAB / LIB / TWM", "PIS LAB / LIB / TWM", "PSC", "EMP", "LA"],
    ["PSC", "BCVS", "SS", "SS", "LA", "PIS", "PT"],
    ["PIS", "PSC", "EMP", "LA", "COE", "COE", "COE"],
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-100 to-slate-100 p-4 sm:p-6 md:p-10 space-y-10">
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-center text-indigo-800 drop-shadow-sm">
        📘 Study Progress Dashboard
      </h1>

      {/* Timetable Button */}
      <div className="flex justify-center">
        <button
          onClick={() => setShowTimetable(!showTimetable)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 sm:px-6 py-2 rounded-xl hover:bg-indigo-700 active:scale-95 transition text-sm sm:text-base"
        >
          <Calendar size={18} />
          {showTimetable ? "Hide Timetable" : "Show Timetable"}
        </button>
      </div>

      {/* 🗓️ Timetable */}
      {showTimetable && (
        <div className="bg-white/90 shadow-xl rounded-2xl border border-indigo-100 overflow-x-auto">
          <h3 className="text-xl sm:text-2xl font-bold text-indigo-700 text-center py-3 border-b border-indigo-100">
            🗓️ Weekly Timetable
          </h3>
          <table className="min-w-full text-center border-collapse text-xs sm:text-sm md:text-base">
            <thead className="bg-indigo-100 text-indigo-800">
              <tr>
                <th className="p-2 sm:p-3 border border-indigo-100">Day</th>
                {[1, 2, 3, 4, 5, 6, 7].map((p) => (
                  <th key={p} className="p-2 sm:p-3 border border-indigo-100">
                    Period {p}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {days.map((day, i) => (
                <tr key={day} className="hover:bg-indigo-50 transition">
                  <td className="p-2 sm:p-3 font-semibold border border-indigo-100 bg-indigo-50">
                    {day}
                  </td>
                  {timetable[i].map((subj, j) => (
                    <td
                      key={`${day}-${j}`}
                      className="p-2 sm:p-3 border border-indigo-100 text-gray-700"
                    >
                      {subj}
                    </td>
                  ))}
                </tr>
              ))}
              <tr className="bg-rose-100">
                <td className="p-2 sm:p-3 font-semibold border border-indigo-100">Sunday</td>
                <td colSpan={7} className="p-2 sm:p-3 border border-indigo-100 text-gray-600 italic">
                  🌞 Holiday
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* ✅ Admin-only Add Topic Form */}
      {isAdmin && (
        <div className="bg-white/80 backdrop-blur-md border border-indigo-100 shadow-lg p-4 sm:p-6 rounded-2xl max-w-3xl mx-auto">
          <h2 className="text-xl sm:text-2xl font-semibold text-indigo-700 mb-4 text-center">
            ➕ Add New Topic
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
            <select
              className="p-2 sm:p-3 border-2 border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-400 text-sm sm:text-base"
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
            >
              <option value="">Select Subject</option>
              {subjects.map((s) => (
                <option key={s.name} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>

            <input
              type="text"
              readOnly
              placeholder="Staff Name"
              value={subjects.find((s) => s.name === selectedSubject)?.staff || ""}
              className="p-2 sm:p-3 border-2 border-indigo-200 rounded-xl bg-gray-50 text-gray-700 text-sm sm:text-base"
            />

            <input
              type="text"
              placeholder="Enter topic name"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="p-2 sm:p-3 border-2 border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-400 text-sm sm:text-base"
            />
          </div>

          <div className="flex justify-end mt-4 sm:mt-5">
            <button
              onClick={handleAddTopic}
              className="bg-indigo-600 text-white px-4 sm:px-6 py-2 rounded-xl hover:bg-indigo-700 active:scale-95 transition text-sm sm:text-base"
            >
              <Plus size={16} className="inline-block mr-1" />
              Add Topic
            </button>
          </div>
        </div>
      )}

      {/* Subject Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {grouped.map((subj, i) => (
          <div
            key={subj.name}
            className="bg-gradient-to-b from-white to-indigo-50 border border-indigo-100 rounded-2xl shadow-md p-4 sm:p-5 hover:shadow-lg transition"
          >
            <div
              onClick={() => toggleDropdown(i)}
              className="flex justify-between items-center cursor-pointer"
            >
              <div>
                <h3 className="text-lg sm:text-2xl font-bold text-indigo-700">{subj.name}</h3>
                <p className="text-sm text-gray-600 mt-1">👩‍🏫 {subj.staff}</p>
              </div>
              {open === i ? (
                <ChevronUp className="text-indigo-600 w-5 h-5 sm:w-6 sm:h-6" />
              ) : (
                <ChevronDown className="text-indigo-600 w-5 h-5 sm:w-6 sm:h-6" />
              )}
            </div>

            {open === i && (
              <div className="mt-3 sm:mt-4 border-t border-indigo-100 pt-3 space-y-2 max-h-52 overflow-y-auto scrollbar-thin scrollbar-thumb-indigo-300 scrollbar-track-indigo-100">
                {subj.topics.length > 0 ? (
                  subj.topics.map((t) => (
                    <div
                      key={t._id || t.id}
                      className="bg-indigo-50 border border-indigo-100 rounded-xl py-2 px-3 text-gray-700 flex justify-between items-center text-sm sm:text-base"
                    >
                      <span>📘 {t.topic}</span>
                      {isAdmin && (
                        <button
                          onClick={() => handleDelete(t._id || t.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-gray-400 italic text-center text-sm">
                    No topics added yet.
                  </p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
