"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { jwtDecode } from "jwt-decode";
import { Menu, X } from "lucide-react";

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const decoded = jwtDecode(token);
      const now = Date.now() / 1000;
      if (decoded.exp && decoded.exp < now) {
        localStorage.removeItem("token");
        router.push("/login");
        return;
      }
      setUser(decoded);
    } catch {
      localStorage.removeItem("token");
      router.push("/login");
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  const navItems = [
    { name: "Home", href: "/dashboard" },
    { name: "Study", href: "/dashboard/study" },
    { name: "Material", href: "/dashboard/material" },
    { name: "Work", href: "/dashboard/work" },
    { name: "Announcement", href: "/dashboard/announcement" },
    { name: "Profile", href: "/dashboard/profile" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-100 to-slate-100">
      {/* Navbar */}
      <header className="bg-white/70 backdrop-blur-md border-b border-indigo-100 shadow-md sticky top-0 z-50">
        <div className="flex justify-between items-center px-6 md:px-12 py-4">
          <div className="flex flex-col">
            <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 drop-shadow-sm">
              CSBS Sync
            </h1>

            {/* 👇 Mobile-only username display when menu is closed */}
            {!menuOpen && (
              <h1 className="text-sm text-gray-600 mt-1 md:hidden">
                {user?.username ? `Hi, ${user.username} 👋` : "Loading..."}
              </h1>
            )}
          </div>

          {/* Desktop Menu */}
          <nav className="hidden md:flex gap-8">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`font-medium ${
                  pathname === item.href
                    ? "text-indigo-700 border-b-2 border-indigo-700"
                    : "text-gray-700 hover:text-indigo-600"
                } transition-all pb-1`}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Right Side */}
          <div className="hidden md:flex items-center gap-4">
            <h1 className="text-lg text-gray-700 italic my-6">
              {user?.username ? `Hi, ${user.username} 👋` : "Loading..."}
            </h1>
            <button
              onClick={handleLogout}
              className="bg-indigo-600 text-white font-semibold px-4 py-2 rounded-xl shadow hover:bg-indigo-700 transition active:scale-95"
            >
              Logout
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-gray-700"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={26} /> : <Menu size={26} />}
          </button>
        </div>

        {/* Mobile Dropdown */}
        {menuOpen && (
          <div className="md:hidden bg-white/90 backdrop-blur-md border-t border-indigo-100 shadow-lg flex flex-col items-center py-4 space-y-3">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className={`font-medium ${
                  pathname === item.href
                    ? "text-indigo-700 border-b-2 border-indigo-700"
                    : "text-gray-700 hover:text-indigo-600"
                } transition`}
              >
                {item.name}
              </Link>
            ))}
            <button
              onClick={handleLogout}
              className="bg-indigo-600 text-white font-semibold px-4 py-2 rounded-xl hover:bg-indigo-700 transition"
            >
              Logout
            </button>
          </div>
        )}
      </header>

      {/* Main Dashboard Container */}
      <main className="max-w-6xl mx-auto md:px-10 py-10">
        <div className="bg-white/80 backdrop-blur-lg border border-indigo-100 rounded-3xl shadow-xl p-6 md:p-10">
          {children}
        </div>
      </main>
    </div>
  );
}
