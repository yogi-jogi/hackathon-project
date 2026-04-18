import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { vaultApi, capsuleApi } from "../api";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import CapsuleCard from "../components/CapsuleCard";
import Navbar from "../components/Navbar";

const TABS = [
  { key: "all",       label: "All" },
  { key: "draft",     label: "Drafts" },
  { key: "locked",    label: "Locked" },
  { key: "unlocked",  label: "Unlocked" },
  { key: "expired",   label: "Expired" },
  { key: "destroyed", label: "Destroyed" },
];

export default function Vault() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const socket = useSocket();
  const navigate = useNavigate();
  
  const [vault, setVault] = useState({ draft: [], locked: [], unlocked: [], expired: [], destroyed: [] });
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [ruleFilter, setRuleFilter] = useState("all");

  const load = useCallback(async () => {
    try { setVault(await vaultApi.get()); }
    catch { showToast("Could not load vault.", "error"); }
    finally { setLoading(false); }
  }, [showToast]);

  useEffect(() => { 
    load(); 
    
    // Re-fetch whenever the user navigates back to this tab/page
    // so hard-deleted one-view capsules immediately disappear
    const onVisible = () => { if (document.visibilityState === "visible") load(); };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", load);

    if (socket) {
      socket.on("vault_update", load);
      return () => {
        socket.off("vault_update", load);
        document.removeEventListener("visibilitychange", onVisible);
        window.removeEventListener("focus", load);
      };
    }
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", load);
    };
  }, [load, socket]);

  async function handleDelete(id) {
    if (!confirm("Permanently delete this capsule?")) return;
    try { await capsuleApi.delete(id); showToast("Deleted.", "info"); load(); }
    catch (err) { showToast(err.message, "error"); }
  }

  const all = [...vault.draft, ...vault.locked, ...vault.unlocked, ...vault.expired, ...vault.destroyed]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  let displayed = tab === "all" ? all : vault[tab] || [];
  
  if (search.trim()) {
    const q = search.toLowerCase();
    displayed = displayed.filter(c => 
      (c.title && c.title.toLowerCase().includes(q)) || 
      (c.text && c.text.toLowerCase().includes(q))
    );
  }

  if (ruleFilter !== "all") {
    displayed = displayed.filter(c => c.rule === ruleFilter);
  }

  const counts = { all: all.length, draft: vault.draft.length, locked: vault.locked.length, unlocked: vault.unlocked.length, expired: vault.expired.length, destroyed: vault.destroyed.length };

  return (
    <div className="min-h-screen bg-bg text-text font-sans">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-5xl">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight mb-1 text-text">My Vault</h1>
            <p className="text-sm text-text-2">
              {user?.username} · {all.length} capsule{all.length !== 1 ? "s" : ""}
            </p>
          </div>
          <button className="btn btn-primary shadow-glow" onClick={() => navigate("/create")}>
            + New capsule
          </button>
        </div>

        {/* Stats */}
        <div className="flex gap-3 mb-7 flex-wrap">
          {[
            { label: "Total",     val: all.length,            color: "text-text" },
            { label: "Locked",    val: vault.locked.length,   color: "text-warning" },
            { label: "Unlocked",  val: vault.unlocked.length, color: "text-success" },
            { label: "Expired",   val: vault.expired.length,  color: "text-text-muted" },
          ].map((s) => (
            <div key={s.label} className="flex items-center gap-3 px-4 py-3 glass-card">
              <div className={`text-xl font-bold font-mono leading-none ${s.color}`}>{s.val}</div>
              <div className="text-[0.7rem] uppercase tracking-wider font-semibold text-text-muted">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 border-b border-border/50 no-scrollbar">
          {TABS.map((t) => (
            <button
              key={t.key}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
                tab === t.key 
                  ? "border-accent text-accent" 
                  : "border-transparent text-text-2 hover:text-text hover:bg-overlay/50 rounded-t-md"
              }`}
              onClick={() => setTab(t.key)}
            >
              {t.label}
              <span className={`text-[0.7rem] px-1.5 py-0.5 rounded-full font-mono ${
                tab === t.key ? "bg-accent-dim text-accent" : "bg-overlay text-text-muted"
              }`}>
                {counts[t.key]}
              </span>
            </button>
          ))}
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <input 
            type="text"
            placeholder="Search capsules..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-input flex-1"
          />
          <select
            value={ruleFilter}
            onChange={(e) => setRuleFilter(e.target.value)}
            className="form-input sm:w-48 appearance-none"
          >
            <option value="all">All Rules</option>
            <option value="timed">Timed</option>
            <option value="one-view">One-view</option>
            <option value="auto-expire">Auto-expire</option>
          </select>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="flex flex-col gap-3 p-4.5 bg-card border border-border rounded-xl animate-pulse">
                <div className="flex justify-between items-start">
                  <div className="w-1/2 h-4 bg-bg-2 rounded" />
                  <div className="w-1/4 h-3 bg-bg-2 rounded" />
                </div>
                <div className="w-1/3 h-3 bg-bg-2 rounded mt-1" />
                <div className="w-full h-16 bg-bg-2 rounded mt-2" />
                <div className="flex justify-end gap-2 mt-2">
                  <div className="w-16 h-6 bg-bg-2 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : displayed.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-24 text-center border border-dashed border-white/10 rounded-2xl bg-white/5 backdrop-blur-sm"
          >
            <div className="text-3xl opacity-20 mb-3">○</div>
            <h3 className="text-lg font-semibold text-text mb-1">Nothing here yet</h3>
            <p className="text-sm text-text-2 mb-5">Create your first capsule and seal a memory.</p>
            <button className="btn btn-primary" onClick={() => navigate("/create")}>
              Create capsule
            </button>
          </motion.div>
        ) : (
          <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence mode="popLayout">
              {displayed.map((c) => (
                <CapsuleCard key={c._id} capsule={c} onDelete={handleDelete} onRefresh={load} />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
}
