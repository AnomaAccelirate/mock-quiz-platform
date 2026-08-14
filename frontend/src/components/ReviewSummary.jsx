import { useState } from "react";
import { ShieldAlert } from "lucide-react";
import Header from "./Header";
import { VIOLATION_LABELS } from "../hooks/useActivityMonitor";

function SummaryStat({ label, value, cls }) {
  return (
    <div className={`rounded-xl border p-4 text-center ${cls}`}>
      <div className="text-2xl font-semibold">{value}</div>
      <div className="text-xs mt-0.5 font-medium">{label}</div>
    </div>
  );
}

export default function ReviewSummary({
  email, timeLeft, questions, answers, marked, violations,
  onBackToTest, onGoTo, onSubmit,
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  const answeredCt = questions.filter((q) => answers[q.id] !== undefined).length;
  const notAnsweredCt = questions.length - answeredCt;
  const markedIdxs = questions.map((q, i) => (marked[q.id] ? i : null)).filter((i) => i !== null);

  return (
    <div className="min-h-screen bg-slate-50">
      <Header timeLeft={timeLeft} email={email} violationCount={violations.length} />
      <div className="max-w-2xl mx-auto p-6">
        <h1 className="text-xl font-semibold text-slate-900">Review before you submit</h1>
        <p className="text-sm text-slate-500 mt-1">Check the summary below. You can still go back and change answers until you submit.</p>

        <div className="grid grid-cols-3 gap-3 mt-6">
          <SummaryStat label="Answered" value={answeredCt} cls="bg-emerald-50 text-emerald-700 border-emerald-200" />
          <SummaryStat label="Not answered" value={notAnsweredCt} cls="bg-rose-50 text-rose-700 border-rose-200" />
          <SummaryStat label="Marked for review" value={markedIdxs.length} cls="bg-amber-50 text-amber-700 border-amber-200" />
        </div>

        {violations.length > 0 && (
          <div className="mt-6 bg-white rounded-xl border border-slate-200 p-4">
            <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-amber-500" /> Activity log ({violations.length})
            </h2>
            <p className="text-xs text-slate-400 mt-1">This log is submitted with your session for the exam administrator to review.</p>
            <ul className="mt-2 space-y-1 text-xs text-slate-500 max-h-32 overflow-y-auto">
              {violations.map((v, i) => (
                <li key={i}>{v.at.toLocaleTimeString()} — {VIOLATION_LABELS[v.type] || v.type}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-6">
          <h2 className="text-sm font-semibold text-slate-700 mb-2">Questions marked for review</h2>
          {markedIdxs.length === 0 ? (
            <p className="text-sm text-slate-400">None marked.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {markedIdxs.map((i) => (
                <button key={i} onClick={() => onGoTo(i)} className="px-3 py-1.5 rounded-lg text-sm border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100">
                  Q{i + 1}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="mt-8 flex gap-3">
          <button onClick={onBackToTest} className="flex-1 border border-slate-300 text-slate-700 rounded-lg py-2.5 text-sm font-medium hover:bg-slate-100">
            Back to test
          </button>
          <button onClick={() => setConfirmOpen(true)} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg py-2.5 text-sm font-medium">
            Submit test
          </button>
        </div>
      </div>

      {confirmOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-6 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
            <h3 className="font-semibold text-slate-900">Submit test?</h3>
            <p className="text-sm text-slate-500 mt-1">
              You have {notAnsweredCt} unanswered question{notAnsweredCt !== 1 ? "s" : ""}. Once submitted, you cannot return to any question.
            </p>
            <div className="mt-5 flex gap-3">
              <button onClick={() => setConfirmOpen(false)} className="flex-1 border border-slate-300 rounded-lg py-2 text-sm">Cancel</button>
              <button onClick={() => onSubmit(false)} className="flex-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg py-2 text-sm font-medium">Yes, submit</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
