import { useCallback, useEffect, useState } from "react";
import { api } from "./api/client";
import { useTimer } from "./hooks/useTimer";
import { useActivityMonitor } from "./hooks/useActivityMonitor";

import Login from "./components/Login";
import Instructions from "./components/Instructions";
import TestQuestion from "./components/TestQuestion";
import ReviewSummary from "./components/ReviewSummary";
import Submitted from "./components/Submitted";

const EXAM_ID = import.meta.env.VITE_EXAM_ID;

export default function App() {
  const [phase, setPhase] = useState("login"); // login -> instructions -> test -> review -> submitted
  const [email, setEmail] = useState("");
  const [examMeta, setExamMeta] = useState(null);
  const [busy, setBusy] = useState(false);

  const [sessionId, setSessionId] = useState(null);
  const [startedAt, setStartedAt] = useState(null);
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});   // { [questionId]: optionIndex }
  const [marked, setMarked] = useState({});     // { [questionId]: true }
  const [visited, setVisited] = useState({});   // { [idx]: true }
  const [current, setCurrent] = useState(0);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    api.getExam(EXAM_ID).then(setExamMeta).catch(() => {});
  }, []);

  const submit = useCallback(
    async (auto = false) => {
      if (!sessionId) return;
      const r = await api.submitSession(sessionId, auto).catch(() => null);
      setResult(r);
      setPhase("submitted");
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    },
    [sessionId]
  );

  const { violations, showReturnPrompt, requestFullscreen } = useActivityMonitor(
    phase === "test" || phase === "review",
    sessionId,
    () => submit(true) // auto-submit once the backend says the violation threshold is crossed
  );

  const timeLeft = useTimer(startedAt, durationSeconds, () => submit(true));

  const handleLoggedIn = (loggedInEmail) => {
    setEmail(loggedInEmail);
    setPhase("instructions");
  };

  const handleStartTest = async () => {
    setBusy(true);
    try {
      const data = await api.startSession(EXAM_ID);
      setSessionId(data.sessionId);
      setStartedAt(data.startedAt);
      setDurationSeconds(data.durationSeconds);
      setQuestions(data.questions);
      setVisited({ 0: true });
      setPhase("test");
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
    } finally {
      setBusy(false);
    }
  };

  const goTo = (idx) => {
    setVisited((v) => ({ ...v, [idx]: true }));
    setCurrent(idx);
    setPaletteOpen(false);
  };

  const selectAnswer = (optIdx) => {
    const q = questions[current];
    setAnswers((a) => ({ ...a, [q.id]: optIdx }));
    api.saveAnswer(sessionId, q.id, optIdx).catch(() => {});
  };

  const clearAnswer = () => {
    const q = questions[current];
    setAnswers((a) => {
      const next = { ...a };
      delete next[q.id];
      return next;
    });
    api.saveAnswer(sessionId, q.id, null).catch(() => {});
  };

  const toggleMark = () => {
    const q = questions[current];
    const next = !marked[q.id];
    setMarked((m) => ({ ...m, [q.id]: next }));
    api.saveMark(sessionId, q.id, next).catch(() => {});
  };

  const next = () => {
    if (current < questions.length - 1) goTo(current + 1);
    else setPhase("review");
  };
  const prev = () => { if (current > 0) goTo(current - 1); };

  if (phase === "login") return <Login onLoggedIn={handleLoggedIn} />;

  if (phase === "instructions") {
    return (
      <Instructions
        questionCount={examMeta?.question_count ?? "—"}
        durationSeconds={examMeta?.duration_seconds ?? 7200}
        onStart={handleStartTest}
        busy={busy}
      />
    );
  }

  if (phase === "submitted") return <Submitted result={result} />;

  if (phase === "review") {
    return (
      <ReviewSummary
        email={email}
        timeLeft={timeLeft}
        questions={questions}
        answers={answers}
        marked={marked}
        violations={violations}
        onBackToTest={() => setPhase("test")}
        onGoTo={(i) => { setPhase("test"); goTo(i); }}
        onSubmit={submit}
      />
    );
  }

  // phase === "test"
  return (
    <TestQuestion
      email={email}
      timeLeft={timeLeft}
      questions={questions}
      current={current}
      answers={answers}
      marked={marked}
      visited={visited}
      onSelect={selectAnswer}
      onClear={clearAnswer}
      onToggleMark={toggleMark}
      onGoTo={goTo}
      onNext={next}
      onPrev={prev}
      onOpenReview={() => setPhase("review")}
      paletteOpen={paletteOpen}
      setPaletteOpen={setPaletteOpen}
      violations={violations}
      showReturnPrompt={showReturnPrompt}
      requestFullscreen={requestFullscreen}
    />
  );
}
