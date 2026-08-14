import { CheckCircle2 } from "lucide-react";

export default function Submitted({ result }) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
        <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-7 h-7" />
        </div>
        <h1 className="text-xl font-semibold text-slate-900 mt-4">Test submitted</h1>
        <p className="text-sm text-slate-500 mt-1">Your responses have been recorded. This session is now closed.</p>

        {result && (
          <div className="mt-6 bg-slate-50 rounded-xl border border-slate-200 p-4 text-sm text-left space-y-1.5">
            <div className="flex justify-between"><span className="text-slate-500">Correct</span><span className="font-medium text-slate-800">{result.correct}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Wrong</span><span className="font-medium text-slate-800">{result.wrong}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Unanswered</span><span className="font-medium text-slate-800">{result.unanswered}</span></div>
            <div className="flex justify-between border-t border-slate-200 pt-1.5 mt-1.5"><span className="text-slate-500">Score</span><span className="font-semibold text-slate-900">{result.score}</span></div>
          </div>
        )}
        <p className="text-xs text-slate-400 mt-5">
          Whether the score is shown immediately is configurable per exam — many certification-style tests withhold it until an admin publishes results.
        </p>
      </div>
    </div>
  );
}
