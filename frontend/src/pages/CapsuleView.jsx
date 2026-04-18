import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { capsuleApi, getMediaUrl } from "../api";
import { decryptText } from "../utils/crypto";
import { useToast } from "../context/ToastContext";
import Navbar from "../components/Navbar";
import CountdownTimer from "../components/CountdownTimer";

const STATUS_LABEL = { locked: "Locked", unlocked: "Unlocked", expired: "Expired", destroyed: "Destroyed" };
const RULE_LABEL   = { timed: "Timed", "one-view": "One-view", "auto-expire": "Auto-expire" };
const STATUS_COLOR = { locked: "bg-warning shadow-[0_0_8px_rgba(251,191,36,0.5)]", unlocked: "bg-success shadow-[0_0_8px_rgba(74,222,128,0.5)]", expired: "bg-text-muted", destroyed: "bg-danger shadow-[0_0_8px_rgba(248,113,113,0.5)]" };

function getMediaTypeFromUrl(url) {
  if (!url) return null;
  const ext = url.split(".").pop().toLowerCase();
  if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext)) return "image";
  if (["mp3", "wav", "ogg", "m4a"].includes(ext)) return "audio";
  if (["mp4", "webm", "mov", "avi"].includes(ext)) return "video";
  return null;
}

export default function CapsuleView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [capsule, setCapsule] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [passcode, setPasscode] = useState("");
  const [decryptedText, setDecryptedText] = useState(null);
  const [decryptedMedia, setDecryptedMedia] = useState(null);
  const [decrypting, setDecrypting] = useState(false);
  const [destroyed, setDestroyed] = useState(false);
  const capsuleRef = useRef(null);

  useEffect(() => {
    capsuleApi.getById(id)
      .then((data) => {
        setCapsule(data);
        capsuleRef.current = data;
        if (!data.isEncrypted) setDecryptedText(data.text);
        if (data.mediaUrl) setDecryptedMedia(data.mediaUrl);
      })
      .catch((err) => {
        // 410 with "destroyed" message — show the Destroyed screen
        if (
          err.status === 410 ||
          (err.message && (err.message.includes("destroyed") || err.message.includes("already been")))
        ) {
          setDestroyed(true);
          return;
        }
        setError(err.message || "This capsule is no longer available.");
      })
      .finally(() => setLoading(false));
  }, [id]);

  async function handleDecrypt(e) {
    e.preventDefault();
    setDecrypting(true);
    try {
      let decryptedAny = false;
      if (capsule.isEncrypted && !decryptedText) {
        const text = await decryptText(capsule.text, passcode, capsule.encryptionIv, capsule.encryptionSalt);
        setDecryptedText(text);
        decryptedAny = true;
      }
      

      
      if (decryptedAny) {
        showToast("Capsule decrypted.", "success");
      }
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setDecrypting(false);
    }
  }

  const Back = () => (
    <button className="btn btn-ghost mb-6 px-0 hover:bg-transparent" onClick={() => navigate("/vault")}>
      ← Back to vault
    </button>
  );

  if (loading) return (
    <div className="min-h-screen bg-bg text-text font-sans">
      <Navbar />
      <div className="spinner-center min-h-[60vh]">
        <div className="spinner spinner-lg" />
      </div>
    </div>
  );

  // — Destroyed screen (one-view already consumed) —
  if (destroyed) return (
    <div className="min-h-screen bg-bg text-text font-sans">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <button className="btn btn-ghost mb-6 px-0 hover:bg-transparent" onClick={() => navigate("/vault")}>
          ← Back to vault
        </button>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card p-12 text-center border border-danger/20"
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
            className="text-6xl mb-5"
          >
            💥
          </motion.div>
          <p className="text-[0.72rem] font-bold text-danger tracking-[0.15em] uppercase mb-3">
            One-view · Destroyed
          </p>
          <h2 className="text-2xl font-bold tracking-tight text-text mb-3">
            This capsule has been permanently destroyed
          </h2>
          <p className="text-sm text-text-muted mb-8 max-w-sm mx-auto">
            This was a one-view capsule. It was opened once and has now self-destructed. The contents are gone forever.
          </p>
          <button className="btn btn-secondary" onClick={() => navigate("/vault")}>
            ← Back to Vault
          </button>
        </motion.div>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-bg text-text font-sans">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Back />
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-10 text-center">
          <p className="text-[0.72rem] font-bold text-text-muted tracking-[0.1em] uppercase mb-4">
            {error.includes("locked") ? "Locked" : error.includes("destroyed") ? "Destroyed" : error.includes("expired") ? "Expired" : "Error"}
          </p>
          <h2 className="text-xl font-bold tracking-tight text-text">{error}</h2>
        </motion.div>
      </div>
    </div>
  );

  const sc = STATUS_COLOR[capsule.status] || "bg-text-muted";

  return (
    <div className="min-h-screen bg-bg text-text font-sans">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Back />

        {capsule.status === "locked" ? (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card p-10 text-center">
            <div className="text-4xl mb-3 opacity-40">⏰</div>
            <h2 className="text-xl font-bold tracking-tight mb-2 text-text">
              {capsule.title || "Sealed capsule"}
            </h2>
            <p className="text-sm text-text-2 mb-4">This capsule is still locked.</p>
            {capsule.unlockTime && <div className="inline-block px-4 py-2 bg-white/5 border border-white/10 rounded-lg"><CountdownTimer targetDate={capsule.unlockTime} /></div>}
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 sm:p-10 relative overflow-hidden">
            
            {/* Meta row */}
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-white/10">
              <span className={`w-2 h-2 rounded-full shrink-0 ${sc}`} />
              <span className="text-[0.78rem] text-text-2 font-semibold">
                {STATUS_LABEL[capsule.status]}
              </span>
              <span className="text-text-faint">·</span>
              <span className="text-[0.78rem] text-text-muted">
                {RULE_LABEL[capsule.rule]}
              </span>
              <span className="text-text-faint">·</span>
              <span className="text-[0.78rem] text-text-muted font-mono">
                {new Date(capsule.createdAt).toLocaleDateString()}
              </span>
            </div>

            <h1 className="text-2xl font-bold tracking-tight mb-1 text-text">
              {capsule.title || "Untitled capsule"}
            </h1>
            <p className="text-xs text-text-muted mb-8">
              by <span className="text-accent font-medium">@{capsule.owner?.username}</span>
            </p>

            {/* Content Decryption Form */}
            {(capsule.isEncrypted && !decryptedText) ? (
              <form onSubmit={handleDecrypt} className="mb-6 p-6 border border-white/10 rounded-xl bg-white/5">
                <div className="text-3xl mb-3 opacity-80 text-accent">🔐</div>
                <h3 className="text-lg font-semibold mb-2">Encrypted Capsule</h3>
                <p className="text-sm text-text-muted mb-4">This capsule's message is end-to-end encrypted. Enter the passcode to unlock it.</p>
                <div className="flex gap-2">
                  <input
                    type="password"
                    placeholder="Enter passcode..."
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value)}
                    className="form-input flex-1"
                  />
                  <button type="submit" disabled={decrypting || !passcode} className="btn btn-primary">
                    {decrypting ? "..." : "Decrypt"}
                  </button>
                </div>
              </form>
            ) : decryptedText ? (
              <p className="text-[0.95rem] leading-relaxed text-text mb-6 whitespace-pre-wrap">
                {decryptedText}
              </p>
            ) : null}
            {/* Decrypted Media Content */}
            {(capsule.mediaType === "image" || getMediaTypeFromUrl(capsule.mediaUrl) === "image") && decryptedMedia && (
              <img src={getMediaUrl(decryptedMedia)} alt="" className="w-full rounded-xl mb-6 opacity-90 border border-border/50" />
            )}
            {(capsule.mediaType === "audio" || getMediaTypeFromUrl(capsule.mediaUrl) === "audio") && decryptedMedia && (
              <audio controls src={getMediaUrl(decryptedMedia)} className="w-full mb-6" />
            )}
            {(capsule.mediaType === "video" || getMediaTypeFromUrl(capsule.mediaUrl) === "video") && decryptedMedia && (
              <video controls src={getMediaUrl(decryptedMedia)} className="w-full rounded-xl mb-6 border border-border/50" />
            )}

            {/* Share link */}
            {capsule.shareToken && (
              <div className="mt-8 pt-6 border-t border-white/10 flex justify-between items-center gap-3 bg-white/5 p-3 rounded-xl border border-dashed border-white/10">
                <span className="text-[0.75rem] text-text-muted font-mono truncate select-all">
                  {window.location.origin}/share/{capsule.shareToken}
                </span>
                <button className="btn btn-secondary text-xs py-1.5 px-3 shrink-0" onClick={async () => {
                  const url = `${window.location.origin}/share/${capsule.shareToken}`;
                  if (navigator.share) {
                    try {
                      await navigator.share({
                        title: capsule.title || "CapsuleX Memory",
                        text: "Check out this digital capsule on CapsuleX!",
                        url: url,
                      });
                    } catch (err) {
                      if (err.name !== "AbortError") showToast("Error sharing", "error");
                    }
                  } else {
                    navigator.clipboard.writeText(url);
                    showToast("Share link copied to clipboard!", "success");
                  }
                }}>Share</button>
              </div>
            )}

            {capsule.rule === "one-view" && (
              <div className="mt-4 p-3 bg-danger-dim border border-danger/20 rounded-xl text-[0.78rem] text-danger font-medium text-center">
                This was a one-view capsule and has been permanently destroyed.
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
