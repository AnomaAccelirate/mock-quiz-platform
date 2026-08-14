import { Router } from "express";
import { pool } from "../db.js";
import { shuffle } from "../utils/shuffle.js";
import { requireAuth, requireActiveSession } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

// Strip correct_index and re-order each question's options according to the
// frozen option_order for this session, so the client only ever sees what
// it's allowed to see.
function sanitizeQuestions(questions, questionOrder, optionOrder) {
  const byId = Object.fromEntries(questions.map((q) => [q.id, q]));
  return questionOrder.map((qid) => {
    const q = byId[qid];
    const order = optionOrder[qid]; // e.g. [2,0,3,1] — original indices in shown order
    return {
      id: q.id,
      text: q.text,
      options: order.map((origIdx) => q.options[origIdx]),
    };
  });
}

// POST /api/session/start  { examId }
// Idempotent: if the participant already has a session for this exam, resume it
// instead of generating a new (differently randomized) one.
router.post("/start", async (req, res) => {
  const { examId } = req.body;
  const email = req.auth.email;

  const existing = await pool.query(
    `SELECT * FROM exam_sessions WHERE exam_id = $1 AND participant_email = $2`,
    [examId, email]
  );
  const exam = (await pool.query(`SELECT * FROM exams WHERE id = $1`, [examId])).rows[0];
  if (!exam) return res.status(404).json({ error: "Exam not found" });

  if (existing.rowCount > 0) {
    const session = existing.rows[0];
    if (session.status !== "in_progress") {
      return res.status(409).json({ error: "This exam has already been submitted" });
    }
    const questions = (
      await pool.query(`SELECT * FROM questions WHERE id = ANY($1::uuid[])`, [session.question_order])
    ).rows;
    return res.json({
      sessionId: session.id,
      startedAt: session.started_at,
      durationSeconds: exam.duration_seconds,
      questions: sanitizeQuestions(questions, session.question_order, session.option_order),
    });
  }

  // Draw a random set of questions for this exam, freeze the order.
  const allQuestions = (await pool.query(`SELECT * FROM questions WHERE exam_id = $1`, [examId])).rows;
  const drawn = shuffle(allQuestions).slice(0, exam.question_count);
  const questionOrder = drawn.map((q) => q.id);
  const optionOrder = {};
  drawn.forEach((q) => {
    optionOrder[q.id] = shuffle(q.options.map((_, i) => i));
  });

  const inserted = await pool.query(
    `INSERT INTO exam_sessions (exam_id, participant_email, question_order, option_order)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [examId, email, JSON.stringify(questionOrder), JSON.stringify(optionOrder)]
  );
  const session = inserted.rows[0];

  res.json({
    sessionId: session.id,
    startedAt: session.started_at,
    durationSeconds: exam.duration_seconds,
    questions: sanitizeQuestions(drawn, questionOrder, optionOrder),
  });
});

// POST /api/session/:sessionId/answer  { questionId, selectedOption }
router.post("/:sessionId/answer", requireActiveSession, async (req, res) => {
  const { questionId, selectedOption } = req.body;
  await pool.query(
    `INSERT INTO responses (session_id, question_id, selected_option)
     VALUES ($1, $2, $3)
     ON CONFLICT (session_id, question_id)
     DO UPDATE SET selected_option = $3, answered_at = now()`,
    [req.params.sessionId, questionId, selectedOption]
  );
  res.json({ ok: true });
});

// POST /api/session/:sessionId/mark  { questionId, marked }
router.post("/:sessionId/mark", requireActiveSession, async (req, res) => {
  const { questionId, marked } = req.body;
  await pool.query(
    `INSERT INTO responses (session_id, question_id, marked_for_review)
     VALUES ($1, $2, $3)
     ON CONFLICT (session_id, question_id)
     DO UPDATE SET marked_for_review = $3`,
    [req.params.sessionId, questionId, marked]
  );
  res.json({ ok: true });
});

// POST /api/session/:sessionId/violation  { type }
router.post("/:sessionId/violation", requireActiveSession, async (req, res) => {
  const { type } = req.body;
  await pool.query(
    `INSERT INTO session_violations (session_id, type) VALUES ($1, $2)`,
    [req.params.sessionId, type]
  );

  const exam = (await pool.query(
    `SELECT e.violation_auto_submit_threshold FROM exams e
     JOIN exam_sessions s ON s.exam_id = e.id WHERE s.id = $1`,
    [req.params.sessionId]
  )).rows[0];
  const count = (await pool.query(
    `SELECT count(*) FROM session_violations WHERE session_id = $1`,
    [req.params.sessionId]
  )).rows[0].count;

  const shouldAutoSubmit = Number(count) >= exam.violation_auto_submit_threshold;
  res.json({ ok: true, violationCount: Number(count), autoSubmit: shouldAutoSubmit });
});

// POST /api/session/:sessionId/submit
router.post("/:sessionId/submit", requireActiveSession, async (req, res) => {
  const session = req.session;
  const { auto = false } = req.body;

  const questions = (
    await pool.query(`SELECT * FROM questions WHERE id = ANY($1::uuid[])`, [session.question_order])
  ).rows;
  const byId = Object.fromEntries(questions.map((q) => [q.id, q]));
  const responses = (
    await pool.query(`SELECT * FROM responses WHERE session_id = $1`, [session.id])
  ).rows;
  const responseByQ = Object.fromEntries(responses.map((r) => [r.question_id, r]));

  let correct = 0, wrong = 0, unanswered = 0;
  for (const qid of session.question_order) {
    const r = responseByQ[qid];
    if (!r || r.selected_option === null || r.selected_option === undefined) {
      unanswered++;
      continue;
    }
    const order = session.option_order[qid]; // shown-order -> original index
    const originalSelectedIndex = order[r.selected_option];
    if (originalSelectedIndex === byId[qid].correct_index) correct++;
    else wrong++;
  }

  const exam = (await pool.query(`SELECT * FROM exams WHERE id = $1`, [session.exam_id])).rows[0];
  const score = correct - wrong * Number(exam.negative_marking || 0);

  await pool.query("BEGIN");
  await pool.query(
    `UPDATE exam_sessions SET status = $1, submitted_at = now() WHERE id = $2`,
    [auto ? "auto_submitted" : "submitted", session.id]
  );
  await pool.query(
    `INSERT INTO results (session_id, correct_count, wrong_count, unanswered_count, score)
     VALUES ($1, $2, $3, $4, $5)`,
    [session.id, correct, wrong, unanswered, score]
  );
  await pool.query("COMMIT");

  res.json({ ok: true, correct, wrong, unanswered, score });
});

export default router;
