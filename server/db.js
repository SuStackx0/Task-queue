const path = require('path')
const fs = require('fs')
const initSqlJs = require('sql.js')

const DB_PATH = process.env.DB_PATH || '/data/queue.db'
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true })

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    tag TEXT NOT NULL CHECK (tag IN ('work', 'study', 'task')),
    state TEXT NOT NULL CHECK (state IN ('queued', 'active', 'paused', 'done', 'dropped', 'expired')),
    next_step TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    paused_at INTEGER,
    done_at INTEGER,
    position REAL NOT NULL,
    urgent INTEGER NOT NULL DEFAULT 0,
    notes TEXT,
    days_total REAL,
    expires_at INTEGER,
    expired_at INTEGER
  );

  CREATE UNIQUE INDEX IF NOT EXISTS idx_one_active
    ON tasks(state) WHERE state = 'active';
`

const MS_PER_DAY = 86400000

let SQL
let sqlDb

function persist() {
  // Write to a temp file and rename over the real one so a crash or power
  // loss mid-write can never leave a half-written, corrupted database file —
  // rename is atomic on the same filesystem, a direct writeFileSync is not.
  const data = sqlDb.export()
  const tmpPath = `${DB_PATH}.tmp`
  fs.writeFileSync(tmpPath, Buffer.from(data))
  fs.renameSync(tmpPath, DB_PATH)
}

async function init() {
  SQL = await initSqlJs({
    locateFile: (file) => path.join(require.resolve('sql.js').replace(/[^/]+$/, ''), file),
  })
  const existed = fs.existsSync(DB_PATH)
  if (existed) {
    sqlDb = new SQL.Database(fs.readFileSync(DB_PATH))
  } else {
    sqlDb = new SQL.Database()
  }
  sqlDb.run(SCHEMA)
  migrate()
  persist()

  const count = get(`SELECT COUNT(*) as c FROM tasks`).c
  console.log(
    existed
      ? `[db] loaded ${DB_PATH} — ${count} task(s) on disk`
      : `[db] no existing database at ${DB_PATH} — starting fresh`
  )
}

function migrate() {
  const names = () => all(`PRAGMA table_info(tasks)`).map((c) => c.name)
  if (!names().includes('urgent')) {
    sqlDb.run(`ALTER TABLE tasks ADD COLUMN urgent INTEGER NOT NULL DEFAULT 0`)
  }
  if (!names().includes('notes')) {
    sqlDb.run(`ALTER TABLE tasks ADD COLUMN notes TEXT`)
  }
  if (!names().includes('days_total')) {
    sqlDb.run(`ALTER TABLE tasks ADD COLUMN days_total REAL`)
  }
  if (!names().includes('expires_at')) {
    sqlDb.run(`ALTER TABLE tasks ADD COLUMN expires_at INTEGER`)
  }
  if (!names().includes('expired_at')) {
    sqlDb.run(`ALTER TABLE tasks ADD COLUMN expired_at INTEGER`)
  }

  // The 'state' CHECK constraint is baked into the table definition at
  // creation time — adding columns above doesn't touch it, so an
  // already-existing database still rejects state='expired' until the
  // table itself is rebuilt with the updated constraint. Rebuild only when
  // needed, copying every column that actually exists so this is safe
  // regardless of which of the migrations above have already run.
  const tableRow = get(`SELECT sql FROM sqlite_master WHERE type='table' AND name='tasks'`)
  if (tableRow && !tableRow.sql.includes("'expired'")) {
    const cols = names()
    sqlDb.run(`ALTER TABLE tasks RENAME TO tasks_old`)
    sqlDb.run(SCHEMA)
    const colList = cols.join(', ')
    sqlDb.run(`INSERT INTO tasks (${colList}) SELECT ${colList} FROM tasks_old`)
    sqlDb.run(`DROP TABLE tasks_old`)
  }
}

/** Lazily flips any queued/paused task whose countdown has run out into
 * 'expired' — runs on every list fetch so correctness holds even after the
 * app was closed when a tube's time actually ran out; nothing is ever
 * silently lost, it's always sitting in the dustbin waiting to be found. */
function sweepExpired() {
  const now = Date.now()
  const due = all(
    `SELECT id FROM tasks WHERE state IN ('queued', 'paused') AND expires_at IS NOT NULL AND expires_at <= ?`,
    [now]
  )
  for (const row of due) {
    sqlDb.run(`UPDATE tasks SET state = 'expired', expired_at = ?, updated_at = ? WHERE id = ?`, [
      now,
      now,
      row.id,
    ])
  }
  if (due.length) persist()
}

function rowsToObjects(result) {
  if (!result || result.length === 0) return []
  const { columns, values } = result[0]
  return values.map((row) => Object.fromEntries(columns.map((c, i) => [c, row[i]])))
}

function all(sql, params = []) {
  const stmt = sqlDb.prepare(sql)
  stmt.bind(params)
  const rows = []
  while (stmt.step()) rows.push(stmt.getAsObject())
  stmt.free()
  return rows
}

function get(sql, params = []) {
  const rows = all(sql, params)
  return rows[0]
}

function run(sql, params = []) {
  sqlDb.run(sql, params)
  persist()
}

module.exports = { init, all, get, run, rowsToObjects, sweepExpired, MS_PER_DAY }
