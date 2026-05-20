import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema.js";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30_000,   // release idle connections after 30s
  connectionTimeoutMillis: 5_000,
  allowExitOnIdle: false,
});

// Swallow pool errors — prevents uncaught exceptions on stale connections
pool.on("error", (_err, _client) => {
  // silent — bad clients are automatically evicted by pg-pool
});

export const db = drizzle(pool, { schema });
