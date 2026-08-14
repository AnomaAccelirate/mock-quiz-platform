import { Router } from "express";
import { pool } from "../db.js";

// NOTE: in production, gate every route in this file behind an admin-only
// auth check (a separate admin JWT / role claim) — omitted here for brevity.
const router = Router();

async function fetchResults(examId) {
  const { rows } = await pool.query(
    `SELECT s.participant_email, r.correct_count, r.wrong_count, r.unanswered_count,
            r.score, s.started_at, s.submitted_at
     FROM results r
     JOIN exam_sessions s ON s.id = r.session_id
     WHERE s.exam_id = $1
     ORDER BY r.score DESC`,
    [examId]
  );
  return rows;
}

// GET /api/admin/exams/:examId/results/top10
router.get("/exams/:examId/results/top10", async (req, res) => {
  const rows = await fetchResults(req.params.examId);
  res.json(rows.slice(0, 10));
});

// GET /api/admin/exams/:examId/results/summary
router.get("/exams/:examId/results/summary", async (req, res) => {
  const rows = await fetchResults(req.params.examId);
  const scores = rows.map((r) => Number(r.score));
  const total = scores.length;
  const avg = total ? scores.reduce((a, b) => a + b, 0) / total : 0;
  const sorted = [...scores].sort((a, b) => a - b);
  const median = total ? sorted[Math.floor(total / 2)] : 0;
  res.json({ totalParticipants: total, averageScore: avg, medianScore: median });
});

// GET /api/admin/exams/:examId/results.csv
router.get("/exams/:examId/results.csv", async (req, res) => {
  const rows = await fetchResults(req.params.examId);
  const header = "rank,email,score,correct,wrong,unanswered,started_at,submitted_at\n";
  const body = rows
    .map((r, i) =>
      [
        i + 1,
        r.participant_email,
        r.score,
        r.correct_count,
        r.wrong_count,
        r.unanswered_count,
        r.started_at.toISOString(),
        r.submitted_at ? r.submitted_at.toISOString() : "",
      ].join(",")
    )
    .join("\n");

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename="exam-${req.params.examId}-results.csv"`);
  res.send(header + body);
});

// PDF export: generate with pdfkit or puppeteer in the same handler shape as
// the CSV route above — render fetchResults() into an HTML template and
// print it, or build the table directly with pdfkit. Omitted here to keep
// this file dependency-light; wire in whichever your team prefers.

export default router;
