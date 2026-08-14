// Local-only dev server. Vercel doesn't use this file — it imports app.js
// directly as a serverless handler via api/index.js. Run with `npm run dev`.
import app from "./app.js";

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`Exam backend listening on :${port}`));
