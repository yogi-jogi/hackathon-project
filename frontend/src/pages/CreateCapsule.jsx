import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { capsuleApi, friendsApi } from "../api";
import { useToast } from "../context/ToastContext";
import Navbar from "../components/Navbar";
import FileUpload from "../components/FileUpload";
import StepProgress from "../components/StepProgress";

import { encryptText, arrayBufferToBase64 } from "../utils/crypto";

const STEPS = ["Content", "Rule", "Recipients", "Security", "Review"];

const RULES = [
  { key: "timed",       icon: "⏰", title: "Unlock at future date", desc: "Stays sealed until a date and time you choose." },
  { key: "one-view",    icon: "◉", title: "Destroy after one view",  desc: "Opens once for the recipient — then gone forever." },
  { key: "auto-expire", icon: "⧗", title: "Auto-expire after duration", desc: "Self-destructs after a defined number of hours." },
];

export default function CreateCapsule() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const draftId = searchParams.get("draft");
  
  const { showToast } = useToast();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);

  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [passcode, setPasscode] = useState("");
  const [media, setMedia] = useState(null);

  const [rule, setRule] = useState("");
  const [unlockTime, setUnlockTime] = useState("");
  const [expireDuration, setExpireDuration] = useState("24");

  const [searchQ, setSearchQ] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [recipients, setRecipients] = useState([]);

  const minDatetime = new Date(Date.now() + 60000).toISOString().slice(0, 16);

  // Load draft if draftId is present
  useEffect(() => {
    if (draftId) {
      capsuleApi.getById(draftId).then((capsule) => {
        if (capsule.status !== "draft") {
          showToast("This capsule has already been sealed.", "info");
          navigate("/vault");
          return;
        }
        setTitle(capsule.title || "");
        setText(capsule.text || "");
        if (capsule.rule && capsule.rule !== "none") setRule(capsule.rule);
        if (capsule.unlockTime) setUnlockTime(new Date(capsule.unlockTime).toISOString().slice(0, 16));
        if (capsule.expiresAt) {
          const diffHours = Math.round((new Date(capsule.expiresAt) - new Date()) / 3600000);
          setExpireDuration(diffHours > 0 ? String(diffHours) : "24");
        }
      }).catch((err) => {
        showToast("Could not load draft.", "error");
        navigate("/vault");
      });
    }
  }, [draftId, showToast]);

  async function searchFriends(q) {
    setSearchQ(q);
    if (!q.trim()) { setSearchResults([]); return; }
    try { setSearchResults(await friendsApi.search(q)); } catch {}
  }

  function addRecipient(u) {
    if (!recipients.find((r) => r._id === u._id)) setRecipients([...recipients, u]);
    setSearchQ(""); setSearchResults([]);
  }

  function validate() {
    if (step === 0) {
      if (!title.trim()) { showToast("Title is required.", "error"); return false; }
      if (!text.trim() && !media) { showToast("Add a message or media file.", "error"); return false; }
    }
    if (step === 1) {
      if (!rule) { showToast("Select a rule.", "error"); return false; }
      if (rule === "timed" && !unlockTime) { showToast("Set an unlock date.", "error"); return false; }
      if ((rule === "timed" || rule === "auto-expire") && unlockTime && new Date(unlockTime) <= new Date()) { showToast("Unlock time must be in the future.", "error"); return false; }
    }
    return true;
  }

  async function saveDraft() {
    setSavingDraft(true);
    try {
      const fd = new FormData();
      fd.append("title", title || "Untitled Draft");
      fd.append("text", text);
      if (rule) fd.append("rule", rule);
      if ((rule === "timed" || rule === "auto-expire") && unlockTime) fd.append("unlockTime", unlockTime);
      if (rule === "auto-expire") fd.append("expireDuration", expireDuration);
      if (media) fd.append("media", media);
      fd.append("isDraft", "true");

      if (draftId) {
        await capsuleApi.update(draftId, fd);
        showToast("Draft updated.", "success");
      } else {
        await capsuleApi.create(fd);
        showToast("Draft saved.", "success");
        navigate("/vault");
      }
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setSavingDraft(false);
    }
  }

  async function submit() {
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("title", title || "Untitled");
      fd.append("rule", rule);
      if ((rule === "timed" || rule === "auto-expire") && unlockTime) fd.append("unlockTime", unlockTime);
      if (rule === "auto-expire") fd.append("expireDuration", expireDuration);
      fd.append("isDraft", "false");
      if (passcode.trim()) {
        const salt = window.crypto.getRandomValues(new Uint8Array(16));
        const saltStr = arrayBufferToBase64(salt);
        fd.append("encryptionSalt", saltStr);

        if (text) {
          const encText = await encryptText(text, passcode, saltStr);
          fd.append("text", encText.cipherText);
          fd.append("isEncrypted", "true");
          fd.append("encryptionIv", encText.iv);
        } else {
          fd.append("text", "");
          fd.append("isEncrypted", "false");
        }

        if (media) {
          fd.append("media", media);
          fd.append("mediaType", media.type.split('/')[0]); // image, audio, or video
        }
      } else {
        fd.append("text", text);
        fd.append("isEncrypted", "false");
        if (media) fd.append("media", media);
      }

      let res;
      if (draftId) {
        res = await capsuleApi.update(draftId, fd);
      } else {
        res = await capsuleApi.create(fd);
      }

      if (recipients.length && res.capsule?._id) {
        for (const r of recipients) try { await friendsApi.send(res.capsule._id, r._id); } catch {}
      }
      showToast("Capsule sealed.", "success");
      navigate("/vault");
    } catch (err) { showToast(err.message, "error"); }
    finally { setLoading(false); }
  }

  const reviewRows = [
    ["Title",      title || "Untitled"],
    ["Text",       text || "—"],
    ["Media",      media ? media.name : "—"],
    ["Rule",       RULES.find((r) => r.key === rule)?.title || "—"],
    ["Unlock at",  (rule === "timed" || rule === "auto-expire") && unlockTime ? new Date(unlockTime).toLocaleString() : (rule === "auto-expire" ? "Immediately" : "—")],
    ["Expires in", rule === "auto-expire" ? `${expireDuration} hours` : "—"],
    ["Recipients", recipients.length ? recipients.map((r) => `@${r.username}`).join(", ") : "Personal vault"],
    ["Passcode",   passcode ? "Enabled (Encrypted)" : "None"],
  ];

  return (
    <div className="min-h-screen bg-bg text-text font-sans">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-3xl">

        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div className="text-center md:text-left">
            <h1 className="text-2xl font-bold tracking-tight mb-1">{draftId ? "Edit Draft" : "New Capsule"}</h1>
            <p className="text-sm text-text-2">Seal a memory. Let it live on its own terms.</p>
          </div>
          <button 
            className="btn btn-secondary"
            onClick={saveDraft}
            disabled={savingDraft || loading}
          >
            {savingDraft ? "Saving..." : "Save as draft"}
          </button>
        </div>

        {/* Steps Indicator */}
        <StepProgress currentStep={step} steps={STEPS} />

        {/* Form Area */}
        <div className="glass-card p-6 sm:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              {/* Step 0: Content */}
              {step === 0 && (
                <div>
                  <h2 className="text-base font-semibold mb-5 text-text-2">Content</h2>
                  <div className="mb-4">
                    <label className="block text-[0.8rem] font-medium text-text-muted mb-1.5 uppercase tracking-wider">Title <span className="text-accent">*</span></label>
                    <input className="form-input" 
                           value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Capsule name…" maxLength={100} />
                  </div>
                  <div className="mb-4">
                    <label className="block text-[0.8rem] font-medium text-text-muted mb-1.5 uppercase tracking-wider">Message</label>
                    <textarea className="form-input resize-y min-h-[120px]" 
                              value={text} onChange={(e) => setText(e.target.value)} placeholder="Write something for the future…" />
                  </div>
                  <div className="mb-2">
                    <label className="block text-[0.8rem] font-medium text-text-muted mb-1.5 uppercase tracking-wider">Attachment (optional)</label>
                    <FileUpload value={media} onChange={setMedia} />
                  </div>
                </div>
              )}

              {/* Step 1: Rule */}
              {step === 1 && (
                <div>
                  <h2 className="text-base font-semibold mb-5 text-text-2">Rule</h2>
                  <div className="flex flex-col gap-3 mb-6">
                    {RULES.map((r) => (
                      <div key={r.key} 
                           className={`flex gap-4 p-5 rounded-xl border cursor-pointer transition-all duration-300 ${
                             rule === r.key ? "bg-accent-dim border-accent/40 shadow-[0_0_15px_rgba(129,140,248,0.15)]" : "bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10"
                           }`}
                           onClick={() => setRule(r.key)}>
                        <div className={`text-2xl mt-0.5 ${rule === r.key ? "text-accent" : "text-text-muted"}`}>{r.icon}</div>
                        <div>
                          <div className={`font-semibold text-sm mb-1 ${rule === r.key ? "text-accent" : "text-text"}`}>{r.title}</div>
                          <div className="text-xs text-text-2">{r.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {(rule === "timed" || rule === "auto-expire") && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mb-6">
                      <label className="block text-[0.8rem] font-medium text-text-muted mb-1.5 uppercase tracking-wider">
                        Unlock date & time {rule === "auto-expire" ? "(Optional)" : ""}
                      </label>
                      <input type="datetime-local" className="form-input" 
                             value={unlockTime} min={minDatetime} onChange={(e) => setUnlockTime(e.target.value)} />
                    </motion.div>
                  )}
                  {rule === "auto-expire" && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
                      <label className="block text-[0.8rem] font-medium text-text-muted mb-1.5 uppercase tracking-wider">Auto-expire after</label>
                      <select className="form-input appearance-none" 
                              value={expireDuration} onChange={(e) => setExpireDuration(e.target.value)}>
                        {[1, 6, 12, 24, 48, 72, 168].map((h) => (
                          <option key={h} value={h}>{h < 24 ? `${h} hour${h > 1 ? "s" : ""}` : `${h / 24} day${h / 24 > 1 ? "s" : ""}`}</option>
                        ))}
                      </select>
                    </motion.div>
                  )}
                </div>
              )}

              {/* Step 2: Recipients */}
              {step === 2 && (
                <div>
                  <h2 className="text-base font-semibold mb-2 text-text-2">Recipients</h2>
                  <p className="text-xs text-text-muted mb-5">Optional. Leave empty to keep in your vault only.</p>
                  
                  <div className="relative mb-4">
                    <label className="block text-[0.8rem] font-medium text-text-muted mb-1.5 uppercase tracking-wider">Search users</label>
                    <input className="form-input" 
                           value={searchQ} onChange={(e) => searchFriends(e.target.value)} placeholder="Search by username or email…" />
                    
                    <AnimatePresence>
                      {searchResults.length > 0 && (
                        <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                                    className="absolute top-[calc(100%+4px)] left-0 w-full glass-card z-20 overflow-hidden shadow-2xl max-h-48 overflow-y-auto">
                          {searchResults.map((u) => (
                            <button key={u._id} type="button" onClick={() => addRecipient(u)} 
                                    className="w-full flex items-center gap-3 px-4 py-3 border-b border-white/5 hover:bg-white/10 transition-colors text-left">
                              <span className="text-sm font-semibold text-accent">@{u.username}</span>
                              <span className="text-xs text-text-muted">{u.email}</span>
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {recipients.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4 p-4 rounded-xl border border-dashed border-white/10 bg-white/5">
                      <p className="w-full text-xs text-text-muted mb-1 font-medium">Selected recipients:</p>
                      {recipients.map((r) => (
                        <span key={r._id} className="inline-flex items-center gap-1.5 pl-2.5 pr-1 py-1 bg-accent-dim border border-accent/20 rounded-full text-xs text-accent">
                          @{r.username}
                          <button type="button" onClick={() => setRecipients(recipients.filter((x) => x._id !== r._id))}
                                  className="w-5 h-5 rounded-full flex items-center justify-center hover:bg-accent/20 text-text-muted hover:text-text transition-colors">×</button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Step 3: Security */}
              {step === 3 && (
                <div>
                  <h2 className="text-base font-semibold mb-2 text-text-2">Security & Encryption</h2>
                  <p className="text-xs text-text-muted mb-5">Optional. Set a passcode to end-to-end encrypt your message.</p>
                  
                  <div className="mb-4">
                    <label className="block text-[0.8rem] font-medium text-text-muted mb-1.5 uppercase tracking-wider">Passcode Lock</label>
                    <input className="form-input" 
                           type="password" value={passcode} onChange={(e) => setPasscode(e.target.value)} placeholder="Secret passcode (optional)" />
                    <p className="text-[0.7rem] text-text-faint mt-1.5 leading-relaxed">
                      If you set a passcode, the text message will be encrypted in your browser before it is sent to the server. 
                      You will need to share this passcode with your recipients out-of-band. <strong>If you forget the passcode, the content cannot be recovered.</strong>
                    </p>
                  </div>
                </div>
              )}

              {/* Step 4: Review */}
              {step === 4 && (
                <div>
                  <h2 className="text-base font-semibold mb-5 text-text-2">Review</h2>
                  <div className="flex flex-col gap-0 border border-white/10 rounded-xl bg-white/5 overflow-hidden">
                    {reviewRows.map(([label, val], i) => (
                      <div key={label} className={`flex gap-4 p-4 ${i !== reviewRows.length - 1 ? "border-b border-white/10" : ""}`}>
                        <span className="text-xs font-medium text-text-muted uppercase tracking-wider w-24 shrink-0">{label}</span>
                        <span className="text-sm text-text-2 break-words">{val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t border-white/10">
            {step > 0 
              ? <button className="btn btn-secondary" onClick={() => setStep(s => s - 1)} disabled={loading || savingDraft}>← Back</button>
              : <div />
            }
            {step < STEPS.length - 1
              ? <button className="btn btn-primary" onClick={() => { if (validate()) setStep(s => s + 1); }}>Continue →</button>
              : <button className="btn btn-primary" onClick={submit} disabled={loading}>
                  {loading ? "Sealing…" : "Seal capsule"}
                </button>
            }
          </div>
        </div>
      </div>
    </div>
  );
}
