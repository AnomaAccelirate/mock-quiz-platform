import { CheckCircle2, ChevronLeft, ChevronRight, Circle, Flag, Maximize2, ShieldAlert, X } from "lucide-react";
import Header from "./Header";

const STATUS = {
  notVisited: { label: "Not Visited", cls: "bg-slate-200 text-slate-500 border-slate-300" },
  notAnswered: { label: "Not Answered", cls: "bg-rose-100 text-rose-700 border-rose-300" },
  answered: { label: "Answered", cls: "bg-emerald-500 text-white border-emerald-600" },
  marked: { label: "Marked for Review", cls: "bg-amber-400 text-amber-950 border-amber-500" },
  markedAnswered: { label: "Answered & Marked", cls: "bg-violet-500 text-white border-violet-600" },
};

export default function TestQuestion({
  email, timeLeft, questions, current, answers, marked, visited,
  onSelect, onClear, onToggleMark, onGoTo, onNext, onPrev, onOpenReview,
  paletteOpen, setPaletteOpen,
  violations, showReturnPrompt, requestFullscreen,
}) {
  const q = questions[current];
  const selected = answers[q.id];
  const isMarked = !!marked[q.id];

  const statusFor = (idx) => {
    const qq = questions[idx];
    const isAnswered = answers[qq.id] !== undefined;
    const isMkd = !!marked[qq.id];
    if (isAnswered && isMkd) return "markedAnswered";
    if (isMkd) return "marked";
    if (isAnswered) return "answered";
    if (visited[idx]) return "notAnswered";
    return "notVisited";
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header timeLeft={timeLeft} email={email} onMenu={() => setPaletteOpen((p) => !p)} violationCount={violations.length} />

      {showReturnPrompt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-slate-900 mt-3">Fullscreen required</h3>
            <p className="text-sm text-slate-500 mt-1">
              This exam must be taken in fullscreen. Exiting has been logged. Return to fullscreen to continue.
            </p>
            <button onClick={requestFullscreen} className="mt-5 w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg py-2.5 text-sm font-medium flex items-center justify-center gap-1.5">
              <Maximize2 className="w-4 h-4" /> Return to fullscreen
            </button>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto flex gap-6 p-4 md:p-6">
        <div className="flex-1 bg-white rounded-2xl border border-slate-200 p-6 md:p-8 min-h-[480px] flex flex-col">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Question {current + 1} of {questions.length}</span>
            <button
              onClick={onToggleMark}
              className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${isMarked ? "bg-amber-400 text-amber-950 border-amber-500" : "border-slate-300 text-slate-600 hover:bg-slate-100"}`}
            >
              <Flag className="w-3.5 h-3.5" /> {isMarked ? "Marked for review" : "Mark for review"}
            </button>
          </div>

          <h2 className="text-lg font-medium text-slate-900 mt-4">{q.text}</h2>

          <div className="mt-6 space-y-3 flex-1">
            {q.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => onSelect(i)}
                className={`w-full text-left border rounded-xl px-4 py-3 text-sm flex items-center gap-3 transition-colors ${selected === i ? "border-indigo-500 bg-indigo-50 text-indigo-900" : "border-slate-200 hover:bg-slate-50 text-slate-700"}`}
              >
                {selected === i ? <CheckCircle2 className="w-4.5 h-4.5 text-indigo-600 shrink-0" /> : <Circle className="w-4.5 h-4.5 text-slate-300 shrink-0" />}
                {opt}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100">
            <button onClick={onPrev} disabled={current === 0} className="flex items-center gap-1 text-sm font-medium text-slate-600 disabled:opacity-30 px-4 py-2 rounded-lg hover:bg-slate-100">
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>
            <button onClick={onClear} disabled={selected === undefined} className="text-sm font-medium text-slate-400 disabled:opacity-30 hover:text-slate-600 px-3">
              Clear answer
            </button>
            <button onClick={onNext} className="flex items-center gap-1 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg">
              {current === questions.length - 1 ? "Review & Submit" : "Next"} <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className={`${paletteOpen ? "block" : "hidden"} md:block w-full md:w-72 shrink-0`}>
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sticky top-4">
            <div className="flex items-center justify-between md:hidden mb-3">
              <span className="text-sm font-semibold text-slate-700">Questions</span>
              <button onClick={() => setPaletteOpen(false)}><X className="w-4 h-4" /></button>
            </div>
            <div className="grid grid-cols-6 md:grid-cols-5 gap-2">
              {questions.map((_, i) => {
                const st = STATUS[statusFor(i)];
                return (
                  <button
                    key={i}
                    onClick={() => onGoTo(i)}
                    className={`w-9 h-9 rounded-lg text-xs font-semibold border flex items-center justify-center ${st.cls} ${current === i ? "ring-2 ring-indigo-500 ring-offset-1" : ""}`}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>
            <div className="mt-5 space-y-1.5 text-xs text-slate-500">
              {Object.entries(STATUS).map(([k, v]) => (
                <div key={k} className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-sm border ${v.cls}`} />
                  {v.label}
                </div>
              ))}
            </div>
            <button onClick={onOpenReview} className="mt-5 w-full bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-lg py-2.5">
              Review & Submit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
