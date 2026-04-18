import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";

const FEATURES = [
  { icon: "⏰", title: "Time-locked", desc: "Seal a message until a specific date. It stays hidden until the moment you choose." },
  { icon: "◉", title: "One-view destroy", desc: "Opens once, then vanishes permanently. True ephemeral sharing with no traces." },
  { icon: "⧗", title: "Auto-expiry", desc: "Set a lifespan. The capsule silently self-destructs when its time runs out." },
  { icon: "◌", title: "Ghost Wall", desc: "Anonymous, temporary posts to a community space. No identity. No history." },
  { icon: "⬡", title: "Secure sharing", desc: "Send via encrypted unique links to specific people — private by design." },
  { icon: "▣", title: "Personal vault", desc: "Your timeline of locked, opened, expired, and destroyed capsules. All in one place." },
];

export default function Landing() {
  const { user } = useAuth();
  const navigate = useNavigate();



  return (
    <div className="min-h-screen bg-bg text-text font-sans selection:bg-accent/30">

      {/* ── Nav ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-bg/80 backdrop-blur-xl border-b border-border">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <span className="flex items-center gap-2 font-bold text-[0.9375rem] tracking-tight">
            <span className="w-6 h-6 rounded-md bg-accent-dim border border-accent/20 flex items-center justify-center text-[0.7rem] text-accent">
              ⏳
            </span>
            CapsuleX
          </span>
          <div className="flex gap-2">
            {user ? (
              <button className="px-3 py-1.5 text-sm font-medium bg-accent text-white hover:bg-accent-hover rounded-md transition-colors shadow-glow" onClick={() => navigate("/vault")}>Go to Vault</button>
            ) : (
              <>
                <button className="px-3 py-1.5 text-sm font-medium text-text hover:bg-overlay rounded-md transition-colors" onClick={() => navigate("/login")}>Sign in</button>
                <button className="px-3 py-1.5 text-sm font-medium bg-accent text-white hover:bg-accent-hover rounded-md transition-colors shadow-glow" onClick={() => navigate("/register")}>Get started</button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="min-h-screen flex flex-col items-center justify-center text-center px-4 pt-24 pb-20 relative overflow-hidden">
        {/* Background Glows */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/5 rounded-full blur-[100px] -z-10 pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-3xl flex flex-col items-center"
        >
          {/* Pill */}
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent-dim border border-accent/20 rounded-full mb-8 text-[0.75rem] font-semibold text-accent tracking-widest uppercase">
            Private-first memory platform
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tighter leading-[1.1] mb-6">
            Memories that live and{" "}
            <span className="text-accent drop-shadow-[0_0_32px_rgba(129,140,248,0.4)]">
              die on your terms
            </span>
          </h1>

          <p className="text-base sm:text-lg text-text-2 max-w-xl leading-relaxed mb-10">
            Create time-bound digital capsules with text, images, voice, and video.
            Share privately. Post anonymously. Let them expire naturally.
          </p>

          <div className="flex gap-3 justify-center flex-wrap">
            {user ? (
              <button className="px-8 py-3.5 text-base font-semibold bg-accent text-white hover:bg-accent-hover rounded-xl transition-all shadow-glow hover:shadow-glow-md hover:-translate-y-0.5" onClick={() => navigate("/vault")}>
                Go to your Vault
              </button>
            ) : (
              <button className="px-8 py-3.5 text-base font-semibold bg-accent text-white hover:bg-accent-hover rounded-xl transition-all shadow-glow hover:shadow-glow-md hover:-translate-y-0.5" onClick={() => navigate("/register")}>
                Start for free
              </button>
            )}
            <button className="px-8 py-3.5 text-base font-semibold bg-bg-2 border border-border text-text hover:bg-overlay rounded-xl transition-all hover:-translate-y-0.5" onClick={() => navigate("/ghost")}>
              Visit Ghost Wall
            </button>
          </div>

          {/* Subtle feature tags */}
          <div className="flex gap-2 justify-center flex-wrap mt-14">
            {["Time-locked", "One-view", "Auto-expire", "Anonymous"].map((t, i) => (
              <motion.span
                key={t}
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 4, repeat: Infinity, delay: i * 0.2, ease: "easeInOut" }}
                className="px-3 py-1 bg-card border border-border rounded-lg text-xs font-medium text-text-muted"
              >
                {t}
              </motion.span>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── Features ── */}
      <section className="py-24 border-t border-border bg-bg-2/30 relative">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <p className="text-[0.75rem] font-bold text-accent tracking-[0.15em] uppercase mb-3">
              What you can do
            </p>
            <h2 className="text-3xl font-bold tracking-tight text-text">
              Built for meaningful moments
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="p-6 bg-card border border-border hover:border-border-hover rounded-2xl transition-colors group"
              >
                <div className="text-2xl mb-4 text-text-2 group-hover:text-accent transition-colors">{f.icon}</div>
                <h3 className="text-[0.95rem] font-semibold mb-2 text-text">{f.title}</h3>
                <p className="text-[0.85rem] text-text-2 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 text-center border-t border-border relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[300px] bg-accent/5 rounded-[100%] blur-[80px] -z-10 pointer-events-none" />
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold tracking-tight mb-3">
            Start preserving moments
          </h2>
          <p className="text-text-2 mb-8 text-[0.95rem]">
            Free to use. Private by design. No tracking.
          </p>
          <button className="px-8 py-3 text-base font-semibold bg-accent text-white hover:bg-accent-hover rounded-xl transition-all shadow-glow hover:-translate-y-0.5" onClick={() => navigate("/register")}>
            Create account
          </button>
        </div>
      </section>

      <footer className="border-t border-border py-6 bg-bg">
        <p className="text-center text-xs text-text-muted">
          © 2024 CapsuleX
        </p>
      </footer>
    </div>
  );
}
