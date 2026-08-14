import jwt from "jsonwebtoken";
import { pool } from "../db.js";

// Verifies the participant's JWT (issued after OTP verification) and attaches
// { email, examId } to req.auth.
export function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Missing token" });

  try {
    req.auth = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

// Loads the session named in req.params.sessionId, checks it belongs to the
// authenticated participant, and blocks any request once the session is no
// longer in_progress. This is what actually makes "no way back after submit"
// true — it doesn't matter what the frontend does or doesn't render.
export async function requireActiveSession(req, res, next) {
  const { sessionId } = req.params;
  const { rows } = await pool.query(
    `SELECT * FROM exam_sessions WHERE id = $1`,
    [sessionId]
  );
  const session = rows[0];
  if (!session) return res.status(404).json({ error: "Session not found" });
  if (session.participant_email !== req.auth.email) {
    return res.status(403).json({ error: "Not your session" });
  }
  if (session.status !== "in_progress") {
    return res.status(409).json({ error: "Session already closed" });
  }
  req.session = session;
  next();
}
