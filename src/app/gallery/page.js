"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { motion } from "framer-motion";

export default function GalleryPage() {
  const [menuOpen, setMenuOpen] = useState(false);

  // 🌆 Sample gallery images (you can replace with your real ones)
  const images = [
    "https://images.unsplash.com/photo-1556761175-5973dc0f32e7",
    "https://images.unsplash.com/photo-1523050854058-8df90110c9f1",
    "https://images.unsplash.com/photo-1519389950473-47ba0277781c",
    "https://images.unsplash.com/photo-1504384308090-c894fdcc538d",
    "https://images.unsplash.com/photo-1504384764586-bb4cdc1707b0",
    "https://images.unsplash.com/photo-1559027615-5b6a0e8b76a6",
    "https://images.unsplash.com/photo-1581093588401-22d1d3aef3b8",
    "https://images.unsplash.com/photo-1542744173-8e7e53415bb0",
  ];

  return (
    <main className="relative min-h-screen flex flex-col items-center justify-start overflow-hidden bg-gradient-to-br from-indigo-700 via-purple-700 to-pink-600 text-white">
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

      {/* 🖼️ Gallery Section */}
      <section className="relative z-10 max-w-6xl mx-auto mt-28 px-6 text-center space-y-10">
        <h1 className="text-5xl md:text-7xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-amber-300 via-pink-300 to-cyan-300 drop-shadow-lg">
          Gallery
        </h1>
        <p className="text-lg md:text-xl text-white/90 leading-relaxed max-w-3xl mx-auto">
          Explore snapshots of our{" "}
          <span className="text-amber-300 font-semibold">CSBS moments</span> —
          projects, events, and celebrations that define our vibrant community.
        </p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5 mt-10"
        >
          {images.map((src, i) => (
            <motion.div
              key={i}
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.3 }}
              className="relative rounded-2xl overflow-hidden shadow-lg hover:shadow-amber-400/40"
            >
              <img
                src={`${src}?auto=format&fit=crop&w=800&q=80`}
                alt={`Gallery ${i + 1}`}
                className="w-full h-48 object-cover rounded-2xl"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity duration-300">
                <p className="text-sm font-semibold">CSBS Event {i + 1}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <footer className="text-white/70 text-sm pt-12">
          © {new Date().getFullYear()} CSBS SYNC — Capturing Every Moment 📸
        </footer>
      </section>
    </main>
  );
}
