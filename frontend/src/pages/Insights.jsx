import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { insightsApi } from "../api";
import Navbar from "../components/Navbar";

export default function Insights() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    insightsApi.get()
      .then(setData)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-bg text-text font-sans">
      <Navbar />
      <div className="spinner-center">
        <div className="spinner spinner-lg" />
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-bg text-text font-sans">
      <Navbar />
      <div className="container mx-auto px-4 py-8 text-center text-danger">{error}</div>
    </div>
  );

  const { timeTravel, aiAnalysis } = data;

  const sentimentColors = {
    Happy: "bg-success/20 text-success border-success/30",
    Nostalgic: "bg-warning/20 text-warning border-warning/30",
    Serious: "bg-danger/20 text-danger border-danger/30",
    Mixed: "bg-accent/20 text-accent border-accent/30",
    Neutral: "bg-text-muted/20 text-text-muted border-text-muted/30"
  };

  return (
    <div className="min-h-screen bg-bg text-text font-sans">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-2">
            <span className="text-accent">✧</span> Insights Dashboard
          </h1>
          {/* <p className="text-sm text-text-2">AI-powered analytics and forecasts for your Vault.</p> */}
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Time Travel Forecast */}
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card p-6 relative overflow-hidden">
            <div className="absolute -right-4 -top-4 text-8xl opacity-5">⏳</div>
            <h2 className="text-[0.75rem] uppercase tracking-widest font-bold text-text-muted mb-6">Time Travel Forecast</h2>

            <div className="flex items-end gap-3 mb-4">
              <span className="text-5xl font-black tracking-tighter text-text">{timeTravel.unlockingThisYear}</span>
              <span className="text-sm text-text-2 pb-1.5 font-medium leading-tight">capsules unlocking<br />this year</span>
            </div>

            <div className="flex gap-4 mt-8 pt-6 border-t border-white/10">
              <div>
                <div className="text-xs text-text-muted uppercase tracking-wider mb-1">Locked</div>
                <div className="text-xl font-bold font-mono text-warning">{timeTravel.totalLocked}</div>
              </div>
              <div>
                <div className="text-xs text-text-muted uppercase tracking-wider mb-1">Unlocked</div>
                <div className="text-xl font-bold font-mono text-success">{timeTravel.totalUnlocked}</div>
              </div>
            </div>
          </motion.div>

          {/* Emotional Landscape */}
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }} className="glass-card p-6 relative overflow-hidden">
            <div className="absolute -right-4 -top-4 text-8xl opacity-5">🧠</div>
            <h2 className="text-[0.75rem] uppercase tracking-widest font-bold text-text-muted mb-6">Emotional Landscape</h2>

            <p className="text-xs text-text-faint mb-4 uppercase tracking-wider">Analysis of {aiAnalysis.analyzedCount} unencrypted capsules</p>

            <div className="flex flex-col gap-3">
              {Object.entries(aiAnalysis.sentimentDistribution).map(([sentiment, count]) => {
                if (count === 0) return null;
                const percentage = Math.round((count / aiAnalysis.analyzedCount) * 100);
                const colorClass = sentimentColors[sentiment] || sentimentColors.Neutral;

                return (
                  <div key={sentiment} className="flex items-center gap-3">
                    <span className={`w-20 text-xs font-semibold px-2 py-1 rounded border text-center ${colorClass}`}>
                      {sentiment}
                    </span>
                    <div className="flex-1 h-2.5 bg-bg-2 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        className={`h-full ${colorClass.split(" ")[1].replace("text-", "bg-")}`}
                      />
                    </div>
                    <span className="text-xs font-mono text-text-muted w-8 text-right">{percentage}%</span>
                  </div>
                );
              })}
              {aiAnalysis.analyzedCount === 0 && (
                <div className="text-sm text-text-muted italic py-4">No unencrypted capsules to analyze yet.</div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Tags */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-6 mb-6">
          <h2 className="text-[0.75rem] uppercase tracking-widest font-bold text-text-muted mb-6">Content Tags</h2>
          <div className="flex flex-wrap gap-2">
            {aiAnalysis.popularTags.length === 0 ? (
              <span className="text-sm text-text-muted italic">No topics discovered.</span>
            ) : (
              aiAnalysis.popularTags.map(({ tag, count }) => (
                <div key={tag} className="flex items-center bg-white/5 border border-white/10 rounded-full px-3 py-1.5 shadow-sm hover:border-white/20 hover:bg-white/10 transition-all cursor-default">
                  <span className="text-sm font-semibold text-text mr-2">{tag}</span>
                  <span className="text-[0.65rem] font-mono text-text-muted bg-black/20 px-1.5 py-0.5 rounded-full">{count}</span>
                </div>
              ))
            )}
          </div>
        </motion.div>

        {/* Privacy Note */}
        <div className="mt-8 p-4 bg-accent/5 border border-accent/20 rounded-xl flex gap-3 items-start">
          <span className="text-accent text-xl leading-none">🔐</span>
          <div>
            <h4 className="text-sm font-bold text-accent mb-1">Privacy First</h4>
            <p className="text-xs text-text-2 leading-relaxed">
              Your security is our priority. {timeTravel.totalEncrypted} End-to-End Encrypted capsule{timeTravel.totalEncrypted !== 1 ? "s" : ""} securely bypassed the AI engine.
              Encrypted content is <strong>never</strong> processed or read by the server.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
