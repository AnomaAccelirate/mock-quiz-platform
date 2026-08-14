import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../db.js";
import { sendOtpEmail } from "../utils/mailer.js";

const router = Router();

// POST /api/auth/send-code  { email, examId }
router.post("/send-code", async (req, res) => {
  const { email, examId } = req.body;
  if (!email || !examId) return res.status(400).json({ error: "email and examId required" });

  const allowed = await pool.query(
    `SELECT 1 FROM allowed_participants WHERE exam_id = $1 AND email = $2`,
    [examId, email]
  );
  if (allowed.rowCount === 0) {
    // Same response whether the email is unknown or just not eligible —
    // don't leak which company emails exist in the system.
    return res.status(200).json({ ok: true });
  }

  const code = String(Math.floor(100000 + Math.random() * 900000));
  const codeHash = await bcrypt.hash(code, 10);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

  await pool.query(
    `INSERT INTO otp_codes (email, exam_id, code_hash, expires_at) VALUES ($1, $2, $3, $4)`,
    [email, examId, codeHash, expiresAt]
  );

  await sendOtpEmail(email, code);
  res.json({ ok: true });
});

// POST /api/auth/verify-code  { email, examId, code }
router.post("/verify-code", async (req, res) => {
  const { email, examId, code } = req.body;
  if (!email || !examId || !code) return res.status(400).json({ error: "email, examId, code required" });

  const { rows } = await pool.query(
    `SELECT * FROM otp_codes
     WHERE email = $1 AND exam_id = $2 AND consumed_at IS NULL AND expires_at > now()
     ORDER BY created_at DESC LIMIT 1`,
    [email, examId]
  );
  const record = rows[0];
  if (!record) return res.status(401).json({ error: "Code expired or not found" });

  const valid = await bcrypt.compare(code, record.code_hash);
  if (!valid) return res.status(401).json({ error: "Incorrect code" });

  await pool.query(`UPDATE otp_codes SET consumed_at = now() WHERE id = $1`, [record.id]);

  const token = jwt.sign({ email, examId }, process.env.JWT_SECRET, { expiresIn: "3h" });
  res.json({ token });
});

export default router;
