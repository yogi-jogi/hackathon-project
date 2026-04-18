/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#0a0a0a",
        "bg-2": "#0f0f0f",
        card: "#111111",
        "card-hover": "#151515",
        overlay: "#1a1a1a",
        border: "rgba(255, 255, 255, 0.06)",
        "border-md": "rgba(255, 255, 255, 0.09)",
        "border-hover": "rgba(255, 255, 255, 0.13)",
        "border-focus": "rgba(129, 140, 248, 0.45)",
        text: "#ececec",
        "text-2": "#999999",
        "text-muted": "#5c5c5c",
        "text-faint": "#3a3a3a",
        accent: "#818cf8",
        "accent-dim": "rgba(129, 140, 248, 0.10)",
        "accent-glow": "rgba(129, 140, 248, 0.20)",
        "accent-hover": "#9da4fa",
        success: "#4ade80",
        "success-dim": "rgba(74, 222, 128, 0.08)",
        warning: "#fbbf24",
        "warning-dim": "rgba(251, 191, 36, 0.08)",
        danger: "#f87171",
        "danger-dim": "rgba(248, 113, 113, 0.08)",
        ghost: "#c084fc",
        "ghost-dim": "rgba(192, 132, 252, 0.08)",
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'glow': '0 0 24px rgba(129,140,248,0.12)',
        'glow-md': '0 0 40px rgba(129,140,248,0.20)',
      }
    },
  },
  plugins: [],
}
