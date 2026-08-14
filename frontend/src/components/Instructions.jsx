export default function Instructions({ questionCount, durationSeconds, onStart, busy }) {
  const hours = Math.round(durationSeconds / 3600);
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <h1 className="text-xl font-semibold text-slate-900">Test instructions</h1>
        <ul className="mt-4 space-y-2.5 text-sm text-slate-600">
          <li>• This test has <strong>{questionCount} questions</strong>, each with 4 options and exactly one correct answer.</li>
          <li>• You have <strong>{hours} hours</strong> to complete the test. The timer starts as soon as you click Start.</li>
          <li>• Use <strong>Mark for Review</strong> to flag a question and revisit it later.</li>
          <li>• A summary page appears after the last question, showing answered / not answered / marked counts before you submit.</li>
          <li>• Once you submit, the test is <strong>final</strong> — you cannot return to any question.</li>
          <li>• If the timer runs out, the test auto-submits with your current answers.</li>
          <li>• This test runs in fullscreen and monitors tab switches, window focus, and copy/paste. Flagged activity is logged with your submission for the administrator's review.</li>
        </ul>
        <button onClick={onStart} disabled={busy} className="mt-7 w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg py-2.5 transition-colors">
          {busy ? "Starting…" : "Start test"}
        </button>
      </div>
    </div>
  );
}
