"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { motion } from "framer-motion";

export default function AboutPage() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <main className="relative min-h-screen flex flex-col items-center justify-start overflow-hidden bg-gradient-to-br from-indigo-700 via-purple-700 to-pink-600 text-white">
      {/* 🌟 Navbar */}
      {/* 🌟 NAVBAR */}
            <nav className="w-full bg-white/10 backdrop-blur-xl sticky top-0 z-50 shadow-xl border-b border-white/10 transition-all duration-300">
              <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
                {/* ✅ Logo Section */}
                <div className="flex flex-col items-start">
                  <h1 className="text-2xl md:text-3xl font-extrabold tracking-wide drop-shadow-md">
                    CSBS<span className="text-amber-300"> SYNC</span>
                  </h1>
                  <p className="text-xs md:text-sm text-white/80 font-medium tracking-wide">
                    A place for students, by students 🎓
                  </p>
                </div>
      
                {/* ✅ Desktop Menu */}
                <div className="hidden md:flex space-x-10 text-lg font-medium items-center">
                  {[
                    { name: "Home", link: "/" },
                    { name: "About", link: "/about" },{ name: "Services", link: "/services" },
                    { name: "Gallery", link: "/gallery" },
                    { name: "Contact", link: "/contact" },
                  ].map((item) => (
                    <Link
                      key={item.name}
                      href={item.link}
                      className="hover:text-amber-300 transition relative after:absolute after:w-0 after:h-[2px] after:bg-amber-300 after:left-0 after:-bottom-1 hover:after:w-full after:transition-all after:duration-300"
                    >
                      {item.name}
                    </Link>
                  ))}
                  <Link
                    href="/login"
                    className="bg-amber-400 text-black px-4 py-2 rounded-xl font-semibold hover:bg-amber-300 transition shadow-md hover:shadow-yellow-400/40"
                  >
                    Login
                  </Link>
                </div>
      
                {/* ✅ Mobile Menu Button */}
                <button
                  className="md:hidden text-white focus:outline-none"
                  onClick={() => setMenuOpen(!menuOpen)}
                  aria-label="Toggle menu"
                >
                  {menuOpen ? <X size={28} /> : <Menu size={28} />}
                </button>
              </div>
      
              {/* ✅ Mobile Dropdown */}
              {menuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="md:hidden flex flex-col bg-white/15 backdrop-blur-2xl text-center py-4 space-y-4 text-base font-medium border-t border-white/10"
                >
                  {[
                    { name: "Home", link: "/" },
                    { name: "About", link: "/about" },
                    { name: "Services", link: "/services" },
                    { name: "Gallery", link: "/gallery" },
                    { name: "Contact", link: "/contact" },
                  ].map((item) => (
                    <Link
                      key={item.name}
                      href={item.link}
                      onClick={() => setMenuOpen(false)}
                      className="hover:text-amber-300 transition"
                    >
                      {item.name}
                    </Link>
                  ))}
                  <Link
                    href="/login"
                    onClick={() => setMenuOpen(false)}
                    className="bg-amber-400 text-black px-5 py-2 rounded-lg font-semibold hover:bg-amber-300 transition mx-auto w-2/3 shadow-md"
                  >
                    Login
                  </Link>
                </motion.div>
              )}
            </nav>
      
      {/* 🌈 About Content */}
      <section className="relative z-10 max-w-5xl mx-auto mt-32 px-6 text-center space-y-10">
        <h1 className="text-5xl md:text-7xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-amber-300 via-pink-300 to-cyan-300 drop-shadow-lg">
          About CSBS Hub
        </h1>

        <p className="text-lg md:text-xl text-white/90 leading-relaxed max-w-3xl mx-auto">
          <span className="text-amber-300 font-bold">CSBS Hub</span> is the official student
          platform for the{" "}
          <span className="text-cyan-300 font-semibold">
            Computer Science and Business Systems
          </span>{" "}
          Department
. It’s designed to connect, collaborate, and share
          resources among students — all in one place.
        </p>

        <div className="grid md:grid-cols-2 gap-8 text-left">
          <div className="bg-white/10 p-6 rounded-2xl backdrop-blur-xl shadow-xl hover:scale-105 transition-all duration-300">
            <h2 className="text-2xl font-bold text-amber-300 mb-3">
              🎯 Our Mission
            </h2>
            <p className="text-white/90">
              To empower CSBS students with tools that make learning more
              interactive, communication smoother, and collaboration stronger.
            </p>
          </div>

          <div className="bg-white/10 p-6 rounded-2xl backdrop-blur-xl shadow-xl hover:scale-105 transition-all duration-300">
            <h2 className="text-2xl font-bold text-cyan-300 mb-3">⚙️ Built With</h2>
            <p className="text-white/90">
              Built using <b>Next.js</b>, <b>NestJS</b>, and <b>Tailwind CSS</b> — combining
              modern frontend elegance with a powerful backend.
            </p>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="bg-white/10 p-6 rounded-2xl backdrop-blur-xl shadow-xl hover:scale-105 transition-all duration-300"
        >
          <h2 className="text-2xl font-bold text-pink-300 mb-3">
            💡 Our Vision
          </h2>
          <p className="text-white/90">
            To make the CSBS Hub not just a class portal — but a digital ecosystem
            that evolves with the students and inspires innovation.
          </p>
        </motion.div>

        <footer className="text-white/70 text-sm pt-10">
          © {new Date().getFullYear()} CSBS Hub — Built with ❤️ by Students
        </footer>
      </section>
    </main>
  );
}
