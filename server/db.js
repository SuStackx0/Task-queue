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
    state TEXT NOT NULL CHECK (state IN ('queued', 'active', 'paused', 'done', 'dropped')),
    next_step TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    paused_at INTEGER,
    done_at INTEGER,
    position REAL NOT NULL,
    urgent INTEGER NOT NULL DEFAULT 0
  );

  CREATE UNIQUE INDEX IF NOT EXISTS idx_one_active
    ON tasks(state) WHERE state = 'active';
`

let SQL
let sqlDb

function persist() {
  const data = sqlDb.export()
  fs.writeFileSync(DB_PATH, Buffer.from(data))
}

async function init() {
  SQL = await initSqlJs({
    locateFile: (file) => path.join(require.resolve('sql.js').replace(/[^/]+$/, ''), file),
  })
  if (fs.existsSync(DB_PATH)) {
    sqlDb = new SQL.Database(fs.readFileSync(DB_PATH))
  } else {
    sqlDb = new SQL.Database()
  }
  sqlDb.run(SCHEMA)
  migrate()
  persist()
}

function migrate() {
  const cols = all(`PRAGMA table_info(tasks)`)
  const hasUrgent = cols.some((c) => c.name === 'urgent')
  if (!hasUrgent) {
    sqlDb.run(`ALTER TABLE tasks ADD COLUMN urgent INTEGER NOT NULL DEFAULT 0`)
  }
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

module.exports = { init, all, get, run, rowsToObjects }
