import { useEffect, useState } from "react";

// Server is the source of truth for elapsed time: we derive timeLeft from
// startedAt (returned by /session/start) rather than counting down locally
// from durationSeconds, so a page refresh or a slow clock can't extend the
// exam.
export function useTimer(startedAt, durationSeconds, onExpire) {
  const [timeLeft, setTimeLeft] = useState(durationSeconds);

  useEffect(() => {
    if (!startedAt) return;
    const start = new Date(startedAt).getTime();

    const tick = () => {
      const elapsed = Math.floor((Date.now() - start) / 1000);
      const remaining = Math.max(durationSeconds - elapsed, 0);
      setTimeLeft(remaining);
      if (remaining === 0) onExpire();
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startedAt, durationSeconds]);

  return timeLeft;
}

export function formatTime(s) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}
