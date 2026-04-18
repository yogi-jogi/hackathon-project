import { forwardRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMediaUrl } from "../api";
import { motion } from "framer-motion";
import CountdownTimer from "./CountdownTimer";
import { useToast } from "../context/ToastContext";

const STATUS = {
  draft:     { label: "Draft",     dot: "bg-accent", dotShadow: "shadow-[0_0_6px_rgba(129,140,248,0.6)]" },
  locked:    { label: "Locked",    dot: "bg-warning", dotShadow: "shadow-[0_0_6px_rgba(251,191,36,0.6)]" },
  unlocked:  { label: "Unlocked",  dot: "bg-success", dotShadow: "shadow-[0_0_6px_rgba(74,222,128,0.6)]" },
  expired:   { label: "Expired",   dot: "bg-text-muted", dotShadow: "" },
  destroyed: { label: "Destroyed", dot: "bg-danger", dotShadow: "shadow-[0_0_6px_rgba(248,113,113,0.6)]" },
};
const RULE = {
  "none":        "No rule",
  "timed":       "Timed",
  "one-view":    "One-view",
  "auto-expire": "Auto-expire",
};

const CapsuleCard = forwardRef(({ capsule, onDelete, onRefresh }, ref) => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [hovered, setHovered] = useState(false);
  const s = STATUS[capsule.status] || STATUS.locked;
  const isLocked = capsule.status === "locked";
  const isDraft = capsule.status === "draft";

  return (
    <motion.article
      ref={ref}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`flex flex-col gap-3 p-5 glass-card transition-all duration-300 ${
        hovered ? "glass-card-hover" : ""
      }`}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold truncate ${isLocked ? "text-text-muted" : "text-text"}`}>
            {isLocked ? "Sealed capsule" : (capsule.title || "Untitled")}
          </p>
          <p className="text-xs text-text-muted mt-0.5">
            {new Date(capsule.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </p>
        </div>

        {/* Status dot + label */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span className={`w-1.5 h-1.5 rounded-full ${s.dot} ${s.dotShadow} shrink-0`} />
          <span className="text-[0.72rem] text-text-2 font-medium">{s.label}</span>
          <span className="text-[0.72rem] text-text-faint">·</span>
          <span className="text-[0.72rem] text-text-muted">{RULE[capsule.rule]}</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1">
        {isLocked ? (
          <div className="px-3 py-3 bg-white/5 rounded-xl border border-white/10">
            {capsule.rule === "timed" && capsule.unlockTime ? (
              <CountdownTimer targetDate={capsule.unlockTime} onExpire={onRefresh} />
            ) : (
              <span className="text-xs text-text-muted">Sealed · waiting for conditions</span>
            )}
          </div>
        ) : capsule.mediaType === "image" ? (
          <img src={getMediaUrl(capsule.mediaUrl)} alt="" className="w-full h-[100px] object-cover rounded-md opacity-85" />
        ) : capsule.mediaType === "audio" ? (
          <audio controls src={getMediaUrl(capsule.mediaUrl)} className="w-full h-8" />
        ) : capsule.mediaType === "video" ? (
          <video controls src={getMediaUrl(capsule.mediaUrl)} className="w-full rounded-md max-h-[120px]" />
        ) : capsule.text ? (
          <p className="text-[0.85rem] text-text-2 leading-relaxed line-clamp-2">
            {capsule.text}
          </p>
        ) : (
          <p className="text-xs text-text-faint italic">No text content</p>
        )}
      </div>

      {/* Footer actions */}
      <div className="flex items-center justify-end gap-1.5 mt-2">
        {isDraft && (
          <button className="btn btn-secondary text-xs py-1.5 px-3" onClick={() => navigate(`/create?draft=${capsule._id}`)}>
            Edit Draft
          </button>
        )}
        {!isLocked && !isDraft && capsule.status !== "destroyed" && (
          <button className="btn btn-ghost text-xs py-1.5 px-3" onClick={() => navigate(`/capsule/${capsule._id}`)}>
            Open →
          </button>
        )}
        {capsule.status === "destroyed" && (
          <span className="text-[0.72rem] text-danger font-semibold px-2 py-1 bg-danger/10 rounded-md border border-danger/20">
            💥 Destroyed
          </span>
        )}
        {capsule.shareToken && !isDraft && (
          <button
            className="btn btn-ghost text-xs py-1.5 px-3"
            onClick={async () => {
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
            }}
            title="Share capsule"
          >
            Share
          </button>
        )}
        {onDelete && (
          <button className="btn btn-danger text-xs py-1.5 px-3" onClick={() => onDelete(capsule._id)}>
            Delete
          </button>
        )}
      </div>
    </motion.article>
  );
});

export default CapsuleCard;
