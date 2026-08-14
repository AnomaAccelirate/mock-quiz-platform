const BASE = import.meta.env.VITE_API_URL;

let authToken = null;
export function setAuthToken(token) {
  authToken = token;
}

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...(options.headers || {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

export const api = {
  getExam: (examId) => request(`/exams/${examId}`),
  sendCode: (email, examId) => request("/auth/send-code", { method: "POST", body: { email, examId } }),
  verifyCode: (email, examId, code) =>
    request("/auth/verify-code", { method: "POST", body: { email, examId, code } }),

  startSession: (examId) => request("/session/start", { method: "POST", body: { examId } }),
  saveAnswer: (sessionId, questionId, selectedOption) =>
    request(`/session/${sessionId}/answer`, { method: "POST", body: { questionId, selectedOption } }),
  saveMark: (sessionId, questionId, marked) =>
    request(`/session/${sessionId}/mark`, { method: "POST", body: { questionId, marked } }),
  logViolation: (sessionId, type) =>
    request(`/session/${sessionId}/violation`, { method: "POST", body: { type } }),
  submitSession: (sessionId, auto = false) =>
    request(`/session/${sessionId}/submit`, { method: "POST", body: { auto } }),
};
