import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ghostApi } from "../api";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import Navbar from "../components/Navbar";
import CountdownTimer from "../components/CountdownTimer";

const TTL = [
  { v: 1, l: "1 hour" }, { v: 6, l: "6 hours" }, { v: 12, l: "12 hours" },
  { v: 24, l: "1 day" }, { v: 72, l: "3 days" }, { v: 168, l: "7 days" },
];

export default function GhostWall() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const socket = useSocket();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [ttl, setTtl] = useState(24);
  const [posting, setPosting] = useState(false);

  const load = useCallback(async () => {
    try { setPosts(await ghostApi.list()); }
    catch { showToast("Could not load Ghost Wall.", "error"); }
    finally { setLoading(false); }
  }, [showToast]);

  useEffect(() => { 
    load(); 
    
    if (socket) {
      socket.on("ghost_update", load);
      return () => socket.off("ghost_update", load);
    }
  }, [load, socket]);

  async function handlePost(e) {
    e.preventDefault();
    if (!text.trim()) return;
    setPosting(true);
    try {
      await ghostApi.post({ text, ttlHours: ttl });
      setText(""); showToast("Posted anonymously.", "success"); 
      // load(); // socket will trigger load automatically
    } catch (err) { showToast(err.message, "error"); }
    finally { setPosting(false); }
  }

  return (
    <div className="min-h-screen bg-bg text-text font-sans">
      {user && <Navbar />}
      <div className="container mx-auto px-4 py-8 max-w-2xl">

        {/* Header */}
        <div className="mb-10 text-center md:text-left">
          <p className="text-[0.75rem] font-semibold text-ghost tracking-widest uppercase mb-2">
            Anonymous · Ephemeral
          </p>
          <h1 className="text-3xl font-bold tracking-tight mb-2 text-text">
            Ghost Wall
          </h1>
          <p className="text-text-2 text-[0.9rem] leading-relaxed max-w-md">
            Post temporary, anonymous messages to the void. No identity. No trace. Just words that disappear.
          </p>
        </div>

        {/* Compose */}
        <div className="glass-card p-5 mb-10 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-ghost/0 via-ghost/50 to-ghost/0 opacity-20" />
          <form onSubmit={handlePost}>
            <div className="mb-3.5">
              <textarea
                className="form-input resize-none"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Write something anonymous…"
                maxLength={500}
                rows={3}
              />
              <div className="flex justify-end mt-1">
                <span className={`text-[0.72rem] ${text.length > 450 ? "text-danger" : "text-text-muted"}`}>
                  {text.length}/500
                </span>
              </div>
            </div>
            <div className="flex gap-2.5 items-center">
              <select
                className="form-input flex-1 appearance-none"
                value={ttl}
                onChange={(e) => setTtl(Number(e.target.value))}
              >
                {TTL.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
              </select>
              <button 
                type="submit" 
                className="btn btn-ghost text-ghost border border-ghost/20 hover:bg-ghost/10" 
                disabled={posting || !text.trim()}
              >
                {posting ? "Posting…" : "Post"}
              </button>
            </div>
          </form>
        </div>

        {/* Posts */}
        <div>
          <p className="text-xs text-text-muted mb-4 font-medium">
            {posts.length} active {posts.length === 1 ? "message" : "messages"}
          </p>

          {loading ? (
              <div className="spinner-center">
               <div className="spinner spinner-lg border-t-ghost" />
             </div>
          ) : posts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-white/10 rounded-2xl bg-white/5 backdrop-blur-sm">
              <div className="text-2xl opacity-20 mb-2">◌</div>
              <h3 className="text-[0.95rem] font-semibold text-text mb-1">No messages yet</h3>
              <p className="text-xs text-text-2">Be the first to leave something in the void.</p>
            </div>
          ) : (
            <motion.div layout className="flex flex-col gap-3">
              <AnimatePresence mode="popLayout">
                {posts.map((p) => <GhostCard key={p._id} post={p} onExpire={load} />)}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

function GhostCard({ post, onExpire }) {
  const [hov, setHov] = useState(false);
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      className={`p-5 glass-card transition-all duration-300 ${
        hov ? "glass-card-hover" : ""
      }`}
    >
      <p className="text-[0.9rem] text-text leading-relaxed mb-3 whitespace-pre-wrap">
        {post.text}
      </p>
      <div className="flex justify-between items-center gap-2">
        <span className="text-[0.72rem] text-text-muted font-mono bg-white/5 px-2 py-0.5 rounded-sm">
          {new Date(post.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
        <CountdownTimer targetDate={post.expiresAt} onExpire={onExpire} />
      </div>
    </motion.div>
  );
}
