"use client";
import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-indigo-900 via-violet-800 to-pink-600 text-white overflow-x-hidden">
      {/* Navbar */}
      <nav className="flex flex-col items-center justify-center px-6 py-4 bg-white/10 backdrop-blur-xl sticky top-0 z-50 shadow-xl border-b border-white/10 transition-all duration-300">
        {/* Logo + Subtitle */}
        <div className="flex flex-col items-center justify-center mb-2">
          <h1 className="text-3xl font-extrabold tracking-wide drop-shadow-md">
            CSBS<span className="text-amber-300"> SYNC</span>
          </h1>
          <p className="text-sm text-white/80 font-medium tracking-wide">
            A place for students, by students 🎓
          </p>
        </div>

        {/* Desktop Menu */}
        <div className="hidden md:flex space-x-10 text-lg font-medium justify-center items-center mt-2">
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

        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-white absolute right-6 top-5 focus:outline-none"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X size={26} /> : <Menu size={26} />}
        </button>
      </nav>

      {/* Mobile Menu */}
      {menuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="md:hidden flex flex-col bg-white/10 backdrop-blur-lg text-center py-6 space-y-5 text-lg font-medium shadow-xl border-b border-white/10"
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

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 py-20">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-5xl md:text-6xl font-extrabold mb-6 leading-tight drop-shadow-lg"
        >
          Welcome to the{" "}
          <span className="text-amber-300">CSBS Department Hub 💻</span>
        </motion.h2>
        <a href="#" class="sp_notify_prompt">Activate notifications</a>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="max-w-2xl text-lg text-white/90 mb-10 leading-relaxed"
        >
          The <strong>Computer Science and Business Systems</strong> Hub is your
          all-in-one digital platform for collaboration, innovation, and
          learning. Discover projects, stay updated, and grow together as a
          community of forward-thinking students.
        </motion.p>

        <motion.div whileHover={{ scale: 1.08 }}>
          <Link
            href="/login"
            className="bg-amber-400 text-black px-8 py-3 rounded-full font-semibold hover:bg-amber-300 transition shadow-lg"
          >
            Get Started
          </Link>
        </motion.div>
      </main>

      {/* Info Section */}
      <section className="bg-white text-gray-800 py-20 px-6 text-center">
        <h3 className="text-3xl md:text-4xl font-bold mb-12 text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
          Why Choose CSBS SYNC 🚀
        </h3>

        <div className="max-w-6xl mx-auto grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              title: "Learn & Grow",
              text: "Access organized notes, schedules, and study materials tailored for CSBS students — anytime, anywhere.",
              color: "from-indigo-500 to-blue-500",
            },
            {
              title: "Collaborate Freely",
              text: "Connect with classmates and mentors. Share ideas, projects, and resources effortlessly.",
              color: "from-pink-500 to-rose-500",
            },
            {
              title: "Innovate Together",
              text: "Bridge business insights with technical brilliance — empowering CSBS learners for the modern world.",
              color: "from-violet-500 to-indigo-500",
            },
          ].map((item, i) => (
            <motion.div
              key={i}
              whileHover={{ scale: 1.05 }}
              className={`p-8 rounded-2xl shadow-md bg-gradient-to-br ${item.color} text-white transition hover:shadow-2xl`}
            >
              <h4 className="text-2xl font-semibold mb-3">{item.title}</h4>
              <p className="text-white/90">{item.text}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Vision Section */}
      <section className="py-20 px-6 bg-gradient-to-r from-violet-800 via-pink-700 to-orange-500 text-center">
        <h3 className="text-3xl md:text-4xl font-bold mb-6 drop-shadow-md">
          “Code. Collaborate. Create.” 💡
        </h3>
        <p className="max-w-3xl mx-auto text-white/90 text-lg leading-relaxed">
          CSBS Hub stands for innovation, teamwork, and knowledge sharing.  
          Built by students, it’s more than a portal — it’s the digital heartbeat
          of the CSBS community.
        </p>
      </section>

      {/* Footer */}
      <footer className="bg-black/40 backdrop-blur-md text-center py-6 mt-auto border-t border-white/10">
        <p className="text-white/80 text-sm md:text-base">
          © {new Date().getFullYear()} <span className="font-semibold">CSBS SYNC</span> — Department of Computer Science & Business Systems  
          | Built with ❤️ using Next.js, TailwindCSS & Framer Motion.
        </p>
      </footer>
    </div>
  );
}
