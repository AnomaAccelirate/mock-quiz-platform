import pg from "pg";
import "dotenv/config";

// Supabase requires SSL, and on Vercel each function invocation is a fresh
// process — so we use the Supabase *connection pooler* (port 6543, not
// 5432) and cap max connections low per instance. Without this, concurrent
// invocations will exhaust Postgres's connection limit quickly.
export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 1,
});
