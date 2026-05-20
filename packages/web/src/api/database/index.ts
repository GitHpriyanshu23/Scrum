import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema.js";

// Single pool — reused across invocations in the same container
let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 3,                          // low max for serverless
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 5_000,
    });
    pool.on("error", () => {
      pool = null; // reset on error so next call gets a fresh pool
    });
  }
  return pool;
}

export const db = drizzle(getPool(), { schema });
