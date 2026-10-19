require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : undefined });
(async () => {
  try {
    await pool.query(`CREATE TABLE IF NOT EXISTS schema_migrations (name TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`);
    const dir = path.join(__dirname, '../src/db/migrations');
    for (const name of fs.readdirSync(dir).filter(x => x.endsWith('.sql')).sort()) {
      const exists = await pool.query('SELECT 1 FROM schema_migrations WHERE name=$1', [name]);
      if (exists.rowCount) continue;
      const client = await pool.connect();
      try { await client.query('BEGIN'); await client.query(fs.readFileSync(path.join(dir, name), 'utf8')); await client.query('INSERT INTO schema_migrations(name) VALUES($1)', [name]); await client.query('COMMIT'); console.log(`Migración aplicada: ${name}`); }
      catch (e) { await client.query('ROLLBACK'); throw e; } finally { client.release(); }
    }
  } catch (e) { console.error('Error en migraciones:', e.message); process.exitCode = 1; }
  finally { await pool.end(); }
})();
