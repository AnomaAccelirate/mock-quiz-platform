import app from "../src/app.js";

// @vercel/node treats a default-exported (req, res) handler as a function.
// An Express app is directly callable as (req, res), so we can hand it off
// as-is — every route (/api/auth/*, /api/session/*, etc.) is still defined
// inside app.js exactly as before.
export default app;
