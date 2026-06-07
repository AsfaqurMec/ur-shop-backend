/**
 * Creates the database (if missing) and runs SQL migrations in order.
 * Tracks applied files in schema_migrations so re-runs skip completed steps.
 *
 * Uses backend .env for DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME.
 * Run from backend root: node scripts/run-migrations.js
 *
 * If your database was built before tracking existed and "Table already exists" errors appear:
 *   node scripts/run-migrations.js --mark-applied-up-to 20250315000012
 * (use the last migration version you know is already applied; then run without flags again)
 *
 * Mark every file in the folder as applied without running SQL (only if DB truly matches):
 *   node scripts/run-migrations.js --mark-all-applied
 */

const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mysql = require('mysql2/promise');

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = parseInt(process.env.DB_PORT || '3306', 10);
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_NAME = process.env.DB_NAME || 'digital_products';

const MIGRATIONS_DIR = path.join(__dirname, '..', 'src', 'database', 'migrations');

/** First 14 chars of filename: YYYYMMDD + 6-digit sequence, e.g. 20250315000012 */
function migrationPrefix(filename) {
  const base = filename.replace(/\.sql$/i, '');
  return base.slice(0, 14);
}

function parseArgs(argv) {
  const markAll = argv.includes('--mark-all-applied');
  const upToIdx = argv.indexOf('--mark-applied-up-to');
  const markUpTo = upToIdx !== -1 && argv[upToIdx + 1] ? argv[upToIdx + 1].trim() : null;
  return { markAll, markUpTo };
}

async function ensureMigrationsTable(conn) {
  await conn.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename VARCHAR(255) NOT NULL PRIMARY KEY,
      applied_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

async function getAppliedFilenames(conn) {
  const [rows] = await conn.query('SELECT filename FROM schema_migrations');
  return new Set(rows.map((r) => r.filename));
}

async function recordApplied(conn, filename) {
  await conn.query('INSERT INTO schema_migrations (filename) VALUES (?)', [filename]);
}

async function main() {
  const { markAll, markUpTo } = parseArgs(process.argv);

  const conn = await mysql.createConnection({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
    multipleStatements: true,
  });

  try {
    await conn.query(
      `CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
    await conn.changeUser({ database: DB_NAME });

    await ensureMigrationsTable(conn);

    const files = fs.readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith('.sql'));
    files.sort();

    if (files.length === 0) {
    //  console.log('No migration files found.');
      return;
    }

    if (markAll) {
    //  console.log('Marking all migration files as applied (no SQL executed)...');
      for (const file of files) {
        await conn.query('INSERT IGNORE INTO schema_migrations (filename) VALUES (?)', [file]);
      //  console.log(`  recorded ${file}`);
      }
    //  console.log('Done. Verify your schema matches these migrations.');
      return;
    }

    if (markUpTo) {
    //  console.log(`Marking migrations applied up to ${markUpTo} (no SQL executed)...`);
      let count = 0;
      for (const file of files) {
        const prefix = migrationPrefix(file);
        if (prefix.length === 14 && prefix <= markUpTo) {
          await conn.query('INSERT IGNORE INTO schema_migrations (filename) VALUES (?)', [file]);
        //  console.log(`  recorded ${file}`);
          count++;
        }
      }
      if (count === 0) {
        console.warn('No files matched. Use 14-digit prefix e.g. 20250315000012');
      }
    //  console.log('Done. Run without flags to apply any newer migrations.');
      return;
    }

    const applied = await getAppliedFilenames(conn);
    const pending = files.filter((f) => !applied.has(f));

    if (pending.length === 0) {
    //  console.log(`All ${files.length} migration(s) already applied. Nothing to do.`);
      return;
    }

    //  console.log(`Running ${pending.length} pending migration(s)...`);
    for (const file of pending) {
      const filePath = path.join(MIGRATIONS_DIR, file);
      const sql = fs.readFileSync(filePath, 'utf8');
      //  console.log(`  - ${file}`);
      await conn.query(sql);
      await recordApplied(conn, file);
    }
    //  console.log('Migrations completed.');
  } finally {
    await conn.end();
  }
}

main().catch((err) => {
  console.error('Migration failed:', err.message || err);
  if (err.code) console.error('Code:', err.code);
  if (err.code === 'ER_TABLE_EXISTS_ERROR') {
    console.error(
      '\nTip: This database was likely created before migration tracking. Mark already-applied steps, then re-run:\n' +
        '  node scripts/run-migrations.js --mark-applied-up-to 20250315000012\n' +
        'Adjust 20250315000012 to the last migration you already have, then:\n' +
        '  node scripts/run-migrations.js\n'
    );
  }
  process.exit(1);
});
