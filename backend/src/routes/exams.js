import { Router } from "express";
import { pool } from "../db.js";

const router = Router();

// GET /api/exams/:examId — public metadata only (no questions, no answers).
// Used by the Instructions screen so it can show question count / duration
// without starting the timer, which only happens on POST /session/start.
router.get("/:examId", async (req, res) => {
  const { rows } = await pool.query(
    `SELECT id, title, duration_seconds, question_count FROM exams WHERE id = $1`,
    [req.params.examId]
  );
  if (rows.length === 0) return res.status(404).json({ error: "Exam not found" });
  res.json(rows[0]);
});

export default router;
