import { motion } from "framer-motion";

/**
 * StepProgress Component
 * 
 * @param {number} currentStep - 0-indexed current step
 * @param {string[]} steps - Array of step labels
 */
export default function StepProgress({ currentStep, steps }) {
  const progress = (currentStep / (steps.length - 1)) * 100;

  return (
    <div className="relative w-full max-w-3xl mx-auto px-4 py-8">
      {/* Background Line (Unfilled) */}
      <div className="absolute top-[46px] left-[calc(4px+1.5rem)] right-[calc(4px+1.5rem)] h-[2px] bg-white/5 -z-10" />

      {/* Progress Line (Filled & Glowing) */}
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `calc(${progress}% - 3rem)` }}
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        className="absolute top-[46px] left-[calc(4px+1.5rem)] h-[3px] bg-gradient-to-r from-accent/20 via-accent/60 to-accent shadow-[0_0_20px_rgba(99,102,241,0.8)] -z-10"
      >
        {/* Leading Edge Glow (Comet Effect) */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-accent rounded-full blur-[8px] opacity-100" />
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full blur-[2px] opacity-80" />
      </motion.div>

      {/* Nodes Container */}
      <div className="flex justify-between items-center relative">
        {steps.map((label, i) => {
          const isActive = i === currentStep;
          const isCompleted = i < currentStep;

          return (
            <div key={label} className="flex flex-col items-center group">
              {/* Minimal Circle Node */}
              <motion.div
                initial={false}
                animate={{
                  scale: isActive ? 1.2 : 1,
                  backgroundColor: isCompleted ? "var(--color-accent)" : isActive ? "var(--color-bg)" : "rgba(255, 255, 255, 0.05)",
                  borderColor: isCompleted || isActive ? "var(--color-accent)" : "rgba(255, 255, 255, 0.1)",
                }}
                className={`w-8 h-8 rounded-full border-2 flex items-center justify-center relative transition-colors duration-500 z-10
                  ${isActive ? "shadow-[0_0_15px_rgba(99,102,241,0.5)]" : ""}
                `}
              >
                {/* Content */}
                <div className="text-[10px] font-bold">
                  {isCompleted ? (
                    <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-white">✓</motion.span>
                  ) : (
                    <span className={isActive ? "text-accent" : "text-text-faint"}>{i + 1}</span>
                  )}
                </div>

                {/* Local glow for active only */}
                {isActive && (
                  <motion.div
                    className="absolute inset-[-4px] rounded-full border border-accent/30"
                    animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.15, 1] }}
                    transition={{ repeat: Infinity, duration: 2.5 }}
                  />
                )}
              </motion.div>

              {/* Label */}
              <motion.span
                animate={{
                  color: isActive ? "var(--color-accent)" : isCompleted ? "var(--color-text-2)" : "var(--color-text-faint)",
                  opacity: isActive || isCompleted ? 1 : 0.6,
                }}
                className={`mt-3 text-[0.65rem] font-bold uppercase tracking-[0.1em] text-center transition-colors duration-300`}
              >
                {label}
              </motion.span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
