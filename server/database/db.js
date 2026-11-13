import { DatabaseSync } from 'node:sqlite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { curatedResources } from './seedResources.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = process.env.DATABASE_PATH || path.join(__dirname, 'skillsupport.sqlite');

// Ensure database directory exists
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export const db = new DatabaseSync(DB_PATH);

// Enable foreign keys and WAL mode for reliability
db.exec('PRAGMA foreign_keys = ON;');

// Initialize schema
export function initDatabase() {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  db.exec(schemaSql);

  // Seed or sync curated resources
  try {
    const existingTitles = new Set(
      db.prepare('SELECT title FROM resources WHERE task_id IS NULL').all().map(r => r.title)
    );

    const insertResource = db.prepare(`
      INSERT INTO resources (skill_name, title, url, type, source, is_verified, description)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    let newCount = 0;
    for (const res of curatedResources) {
      if (!existingTitles.has(res.title)) {
        insertResource.run(
          res.skill_name,
          res.title,
          res.url,
          res.type,
          res.source,
          res.is_verified,
          res.description
        );
        newCount++;
      }
    }
    if (newCount > 0) {
      console.log(`[Database] Synced ${newCount} new verified engineering resources into database.`);
    }
  } catch (err) {
    console.error('[Database] Resource seeding error:', err);
  }
}

// Database helper functions
export function queryAll(sql, params = []) {
  const stmt = db.prepare(sql);
  return stmt.all(...params);
}

export function queryOne(sql, params = []) {
  const stmt = db.prepare(sql);
  return stmt.get(...params);
}

export function run(sql, params = []) {
  const stmt = db.prepare(sql);
  return stmt.run(...params);
}

export function exec(sql) {
  return db.exec(sql);
}

// Transaction wrapper
export function transaction(callback) {
  db.exec('BEGIN TRANSACTION;');
  try {
    const result = callback();
    db.exec('COMMIT;');
    return result;
  } catch (err) {
    db.exec('ROLLBACK;');
    throw err;
  }
}

export default {
  db,
  initDatabase,
  queryAll,
  queryOne,
  run,
  exec,
  transaction
};
