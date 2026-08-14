import { Clock, Menu, ShieldAlert } from "lucide-react";
import { formatTime } from "../hooks/useTimer";

export default function Header({ timeLeft, email, onMenu, violationCount = 0 }) {
  const low = timeLeft <= 300;
  return (
    <div className="sticky top-0 z-10 bg-white border-b border-slate-200">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-4 md:px-6 py-3">
        <div className="flex items-center gap-3">
          {onMenu && (
            <button onClick={onMenu} className="md:hidden p-1.5 rounded-lg hover:bg-slate-100">
              <Menu className="w-5 h-5 text-slate-600" />
            </button>
          )}
          <div className="w-7 h-7 rounded-md bg-indigo-600 flex items-center justify-center text-white font-bold text-xs">EX</div>
          <span className="text-sm text-slate-500 hidden sm:inline">{email}</span>
        </div>
        <div className="flex items-center gap-2">
          {violationCount > 0 && (
            <div className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200" title="Flagged activity this session">
              <ShieldAlert className="w-3.5 h-3.5" /> {violationCount}
            </div>
          )}
          <div className={`flex items-center gap-1.5 font-mono text-sm font-semibold px-3 py-1.5 rounded-lg ${low ? "bg-rose-50 text-rose-600" : "bg-slate-100 text-slate-700"}`}>
            <Clock className="w-4 h-4" /> {formatTime(timeLeft)}
          </div>
        </div>
      </div>
    </div>
  );
}
