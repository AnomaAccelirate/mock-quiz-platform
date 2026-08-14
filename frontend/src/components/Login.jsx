import { useState } from "react";
import { AlertCircle } from "lucide-react";
import { api, setAuthToken } from "../api/client";

const EXAM_ID = import.meta.env.VITE_EXAM_ID;

export default function Login({ onLoggedIn }) {
  const [email, setEmail] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpInput, setOtpInput] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const sendCode = async () => {
    setError("");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Enter a valid email address.");
      return;
    }
    setBusy(true);
    try {
      await api.sendCode(email, EXAM_ID);
      setOtpSent(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const verifyCode = async () => {
    setError("");
    setBusy(true);
    try {
      const { token } = await api.verifyCode(email, EXAM_ID, otpInput);
      setAuthToken(token);
      onLoggedIn(email);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">EX</div>
          <span className="text-slate-400 text-sm tracking-wide">MOCK TEST PLATFORM</span>
        </div>
        <h1 className="text-xl font-semibold text-slate-900 mt-4">Sign in to begin</h1>
        <p className="text-sm text-slate-500 mt-1">Use your company email address. We'll send a one-time code.</p>

        <label className="block text-sm font-medium text-slate-700 mt-6 mb-1">Company email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={otpSent}
          placeholder="you@company.com"
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm disabled:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />

        {otpSent && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-slate-700 mb-1">6-digit code</label>
            <input
              type="text"
              maxLength={6}
              value={otpInput}
              onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ""))}
              placeholder="••••••"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm tracking-widest focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <p className="text-xs text-slate-400 mt-2">Check your inbox for the code — it expires in 10 minutes.</p>
          </div>
        )}

        {error && (
          <div className="mt-3 text-sm text-rose-600 flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        )}

        {!otpSent ? (
          <button onClick={sendCode} disabled={busy} className="mt-6 w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg py-2.5 transition-colors">
            {busy ? "Sending…" : "Send code"}
          </button>
        ) : (
          <button onClick={verifyCode} disabled={busy} className="mt-6 w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg py-2.5 transition-colors">
            {busy ? "Verifying…" : "Verify & continue"}
          </button>
        )}
      </div>
    </div>
  );
}
