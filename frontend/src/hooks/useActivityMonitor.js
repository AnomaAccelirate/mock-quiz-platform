import { useCallback, useEffect, useState } from "react";
import { api } from "../api/client";

export const VIOLATION_LABELS = {
  tab_hidden: "Switched tab / minimized window",
  window_blur: "Left the browser window",
  fullscreen_exit: "Exited fullscreen",
  copy_attempt: "Attempted to copy question text",
  paste_attempt: "Attempted to paste",
  right_click: "Attempted to right-click",
  devtools_suspected: "Developer tools activity detected",
};

// Logs browser-activity events to the backend (source of truth for the
// violation count / auto-submit decision) and mirrors them locally for
// immediate UI feedback (badge count, review-page log).
export function useActivityMonitor(active, sessionId, onAutoSubmit) {
  const [violations, setViolations] = useState([]);
  const [showReturnPrompt, setShowReturnPrompt] = useState(false);

  const log = useCallback(
    async (type) => {
      setViolations((v) => [...v, { type, at: new Date() }]);
      if (!sessionId) return;
      try {
        const { autoSubmit } = await api.logViolation(sessionId, type);
        if (autoSubmit) onAutoSubmit();
      } catch {
        // If logging fails (e.g. network blip), don't block the exam UI —
        // the event is still in local state for the review page.
      }
    },
    [sessionId, onAutoSubmit]
  );

  useEffect(() => {
    if (!active) return;

    const onVisibility = () => { if (document.hidden) log("tab_hidden"); };
    const onBlur = () => log("window_blur");
    const onFsChange = () => {
      if (!document.fullscreenElement) {
        log("fullscreen_exit");
        setShowReturnPrompt(true);
      }
    };
    const onCopy = (e) => { e.preventDefault(); log("copy_attempt"); };
    const onPaste = (e) => { e.preventDefault(); log("paste_attempt"); };
    const onContext = (e) => { e.preventDefault(); log("right_click"); };

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onBlur);
    document.addEventListener("fullscreenchange", onFsChange);
    document.addEventListener("copy", onCopy);
    document.addEventListener("paste", onPaste);
    document.addEventListener("contextmenu", onContext);

    const devtoolsCheck = setInterval(() => {
      const start = performance.now();
      // eslint-disable-next-line no-debugger
      debugger;
      if (performance.now() - start > 100) log("devtools_suspected");
    }, 4000);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("fullscreenchange", onFsChange);
      document.removeEventListener("copy", onCopy);
      document.removeEventListener("paste", onPaste);
      document.removeEventListener("contextmenu", onContext);
      clearInterval(devtoolsCheck);
    };
  }, [active, log]);

  const requestFullscreen = () => {
    const el = document.documentElement;
    if (el.requestFullscreen) el.requestFullscreen().catch(() => {});
    setShowReturnPrompt(false);
  };

  return { violations, showReturnPrompt, requestFullscreen };
}
