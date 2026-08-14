import express from "express";
import cors from "cors";
import "dotenv/config";

import authRoutes from "./routes/auth.js";
import sessionRoutes from "./routes/session.js";
import adminRoutes from "./routes/admin.js";
import examsRoutes from "./routes/exams.js";

const app = express();
app.use(cors({ origin: process.env.FRONTEND_ORIGIN }));
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/session", sessionRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/exams", examsRoutes);

app.get("/health", (_req, res) => res.json({ ok: true }));

export default app;
