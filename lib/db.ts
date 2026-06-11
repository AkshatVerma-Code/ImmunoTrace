import { Pool } from "pg";

declare global {
  // eslint-disable-next-line no-var
  var pgPool: Pool | undefined;
}

export const pool =
  global.pgPool ||
  new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10, // Maximum number of connections in the pool
    idleTimeoutMillis: 30000,
  });

if (process.env.NODE_ENV !== "production") {
  global.pgPool = pool;
}

// Add a helper wrapper to mimic the mysql2/promise behavior
// This avoids having to change every single query file immediately
export const dbHelper = {
  query: async (text: string, params?: any[]) => {
    const client = await pool.connect();
    try {
      // Replace MySQL ? parameters with PostgreSQL $1, $2, etc.
      let pgText = text;
      if (params && params.length > 0) {
        let i = 1;
        pgText = text.replace(/\?/g, () => `$${i++}`);
      }
      const result = await client.query(pgText, params);
      return [result.rows, result.fields];
    } finally {
      client.release();
    }
  },
  execute: async (text: string, params?: any[]) => {
    const client = await pool.connect();
    try {
      let pgText = text;
      if (params && params.length > 0) {
        let i = 1;
        pgText = text.replace(/\?/g, () => `$${i++}`);
      }
      const result = await client.query(pgText, params);
      // Mock MySQL execute response format for INSERTs
      return [{ insertId: result.rows[0]?.id || 0, affectedRows: result.rowCount }, null];
    } finally {
      client.release();
    }
  },
  getConnection: async () => {
    const client = await pool.connect();
    return {
      ping: async () => await client.query("SELECT 1"),
      release: () => client.release(),
    };
  }
};

// We export dbHelper as pool so the rest of the app doesn't need to change imports
export { dbHelper as legacyPool };

