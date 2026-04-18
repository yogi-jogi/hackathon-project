import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { getMediaUrl } from "../api";
import { motion } from "framer-motion";
import { capsuleApi } from "../api";
import { decryptText } from "../utils/crypto";
import CountdownTimer from "../components/CountdownTimer";

const RULE_LABEL = { timed: "Timed", "one-view": "One-view", "auto-expire": "Auto-expire" };

export default function ShareView() {
  const { token } = useParams();
  const [capsule, setCapsule] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [passcode, setPasscode] = useState("");
  const [decryptedText, setDecryptedText] = useState(null);
  const [decrypting, setDecrypting] = useState(false);

  useEffect(() => {
    capsuleApi.getByToken(token)
      .then((data) => {
        setCapsule(data);
        if (!data.isEncrypted) setDecryptedText(data.text);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  async function handleDecrypt(e) {
    e.preventDefault();
    setDecrypting(true);
    try {
      const text = await decryptText(capsule.text, passcode, capsule.encryptionIv, capsule.encryptionSalt);
      setDecryptedText(text);
    } catch (err) {
      alert(err.message);
    } finally {
      setDecrypting(false);
    }
  }

  const brand = (
    <div className="sticky top-0 z-50 bg-bg/90 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-6 h-[52px] flex items-center gap-2 font-bold text-[0.9rem] tracking-tight">
        <span className="w-[22px] h-[22px] rounded-md bg-accent-dim border border-accent/20 flex items-center justify-center text-[0.65rem] text-accent">
          ⏳
        </span>
        CapsuleX
      </div>
    </div>
  );

  if (loading) return (
    <div className="min-h-screen bg-bg text-text font-sans">
      {brand}
      <div className="flex justify-center items-center min-h-[80vh]">
        <div className="w-8 h-8 border-2 border-accent/20 border-t-accent rounded-full animate-spin" />
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-bg text-text font-sans">
      {brand}
      <div className="container mx-auto px-4 py-16 max-w-2xl text-center">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-2xl p-10 shadow-sm">
          <p className="text-[0.72rem] font-bold text-text-muted tracking-[0.08em] uppercase mb-3">
            {error.includes("locked") ? "Locked" : error.includes("destroyed") ? "Destroyed" : "Unavailable"}
          </p>
          <h2 className="text-xl font-bold tracking-tight text-text">{error}</h2>
        </motion.div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-bg text-text font-sans">
      {brand}
      <div className="container mx-auto px-4 py-10 pb-20 max-w-2xl">
        <p className="text-[0.72rem] font-bold text-text-muted tracking-[0.08em] uppercase mb-2">
          Shared capsule
        </p>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-2xl p-7 shadow-sm">
          <div className="flex items-center gap-2 mb-4 pb-4 border-b border-border/50">
            <span className="text-[0.72rem] font-semibold text-text-2 capitalize">{capsule.status}</span>
            <span className="text-text-faint">·</span>
            <span className="text-[0.72rem] text-text-muted">{RULE_LABEL[capsule.rule]}</span>
            <span className="text-text-faint">·</span>
            <span className="text-[0.72rem] text-text-muted font-mono">{new Date(capsule.createdAt).toLocaleDateString()}</span>
          </div>

          <h1 className="text-xl font-bold tracking-tight mb-6 text-text">
            {capsule.title || "Untitled capsule"}
          </h1>

          {/* Content */}
          {capsule.isEncrypted && decryptedText === null ? (
            <form onSubmit={handleDecrypt} className="mb-5 p-6 border border-border rounded-xl bg-bg-2 shadow-inner">
              <div className="text-3xl mb-3 opacity-80 text-accent">🔐</div>
              <h3 className="text-lg font-semibold mb-2">Encrypted Capsule</h3>
              <p className="text-sm text-text-muted mb-4">This capsule's message is end-to-end encrypted. Enter the passcode to unlock it.</p>
              <div className="flex gap-2">
                <input
                  type="password"
                  placeholder="Enter passcode..."
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  className="flex-1 bg-card border border-border rounded-lg p-2.5 text-sm focus:outline-none focus:border-accent/50 transition-all"
                />
                <button type="submit" disabled={decrypting || !passcode} className="px-4 py-2 bg-accent text-white font-medium rounded-lg hover:bg-accent-hover transition-colors shadow-glow disabled:opacity-50">
                  {decrypting ? "..." : "Decrypt"}
                </button>
              </div>
            </form>
          ) : decryptedText ? (
            <p className="text-[0.95rem] leading-relaxed text-text mb-5 whitespace-pre-wrap">
              {decryptedText}
            </p>
          ) : null}
          {capsule.mediaType === "image" && <img src={getMediaUrl(capsule.mediaUrl)} alt="" className="w-full rounded-xl mb-5 opacity-90 border border-border/50" />}
          {capsule.mediaType === "audio" && <audio controls src={getMediaUrl(capsule.mediaUrl)} className="w-full mb-5" />}
          {capsule.mediaType === "video" && <video controls src={getMediaUrl(capsule.mediaUrl)} className="w-full rounded-xl mb-5 border border-border/50" />}

          {capsule.rule === "one-view" && (
            <div className="mt-2 p-3 bg-danger-dim border border-danger/10 rounded-xl text-[0.78rem] text-danger font-medium">
              This one-view capsule has now been permanently destroyed.
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
