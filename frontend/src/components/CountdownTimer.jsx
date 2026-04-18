import { useState, useEffect } from "react";

export default function CountdownTimer({ targetDate, onExpire }) {
  const [rem, setRem] = useState(calc(targetDate));

  useEffect(() => {
    const id = setInterval(() => {
      const r = calc(targetDate);
      setRem(r);
      if (r.total <= 0 && onExpire) onExpire();
    }, 1000);
    return () => clearInterval(id);
  }, [targetDate, onExpire]);

  if (rem.total <= 0) {
    return (
      <span className="font-mono text-xs text-success">
        Unlocking…
      </span>
    );
  }

  const parts = [];
  if (rem.days > 0)  parts.push(`${rem.days}d`);
  if (rem.hours > 0 || rem.days > 0) parts.push(`${rem.hours}h`);
  if (rem.minutes > 0 || rem.hours > 0) parts.push(`${rem.minutes}m`);
  parts.push(`${String(rem.seconds).padStart(2, "0")}s`);

  return (
    <span className="font-mono text-xs text-text-2 tracking-wider">
      {parts.join(" ")} remaining
    </span>
  );
}

function calc(t) {
  const total = Math.max(0, new Date(t).getTime() - Date.now());
  return {
    total,
    days:    Math.floor(total / 86400000),
    hours:   Math.floor((total % 86400000) / 3600000),
    minutes: Math.floor((total % 3600000) / 60000),
    seconds: Math.floor((total % 60000) / 1000),
  };
}
