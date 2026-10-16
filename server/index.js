const path = require('path')
const Fastify = require('fastify')
const fastifyStatic = require('@fastify/static')
const db = require('./db')

const PORT = process.env.PORT ? Number(process.env.PORT) : 4747
const app = Fastify({ logger: true })

app.register(fastifyStatic, {
  root: path.join(__dirname, '..', 'dist'),
})

function now() {
  return Date.now()
}

function serialize(row) {
  return {
    id: row.id,
    title: row.title,
    tag: row.tag,
    state: row.state,
    nextStep: row.next_step,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    pausedAt: row.paused_at,
    doneAt: row.done_at,
    position: row.position,
    daysTotal: row.days_total,
    expiresAt: row.expires_at,
    expiredAt: row.expired_at,
  }
}

const MAX_DAYS = 30

function clampDays(days) {
  const n = Number(days)
  if (!Number.isFinite(n)) return null
  return Math.max(1, Math.min(MAX_DAYS, Math.round(n)))
}

app.get('/health', async () => ({ ok: true }))

app.get('/api/tasks', async () => {
  db.sweepExpired()

  const tasks = db
    .all(`SELECT * FROM tasks WHERE state NOT IN ('done', 'dropped', 'expired') ORDER BY position ASC`)
    .map(serialize)

  const expired = db
    .all(`SELECT * FROM tasks WHERE state = 'expired' ORDER BY expired_at DESC`)
    .map(serialize)

  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)
  const doneRow = db.get(`SELECT COUNT(*) as c FROM tasks WHERE state = 'done' AND done_at >= ?`, [
    startOfDay.getTime(),
  ])

  return { tasks, expired, doneToday: doneRow ? doneRow.c : 0 }
})

app.post('/api/tasks', async (req, reply) => {
  const { title, tag, days } = req.body || {}
  if (!title || typeof title !== 'string' || !title.trim()) {
    return reply.code(400).send({ error: 'title is required' })
  }
  if (!['work', 'study', 'task'].includes(tag)) {
    return reply.code(400).send({ error: 'tag must be work, study, or task' })
  }
  const daysTotal = clampDays(days)
  if (!daysTotal) {
    return reply.code(400).send({ error: `days (1-${MAX_DAYS}) is required` })
  }
  const t = now()
  const maxRow = db.get(`SELECT MAX(position) as m FROM tasks`)
  const maxPos = maxRow && maxRow.m != null ? maxRow.m : 0
  const expiresAt = t + daysTotal * db.MS_PER_DAY
  db.run(
    `INSERT INTO tasks (title, tag, state, created_at, updated_at, position, days_total, expires_at)
     VALUES (?, ?, 'queued', ?, ?, ?, ?, ?)`,
    [title.trim(), tag, t, t, maxPos + 1, daysTotal, expiresAt]
  )
  const row = db.get(`SELECT * FROM tasks ORDER BY id DESC LIMIT 1`)
  reply.code(201).send(serialize(row))
})

app.post('/api/tasks/:id/expire', async (req, reply) => {
  const id = Number(req.params.id)
  const row = db.get(`SELECT * FROM tasks WHERE id = ?`, [id])
  if (!row) return reply.code(404).send({ error: 'not found' })
  if (row.state !== 'queued' && row.state !== 'paused') {
    return reply.code(409).send({ error: 'only a queued or paused tube can expire' })
  }
  const t = now()
  db.run(`UPDATE tasks SET state = 'expired', expired_at = ?, updated_at = ? WHERE id = ?`, [t, t, id])
  const updated = db.get(`SELECT * FROM tasks WHERE id = ?`, [id])
  reply.send(serialize(updated))
})

app.post('/api/tasks/:id/restore', async (req, reply) => {
  const id = Number(req.params.id)
  const row = db.get(`SELECT * FROM tasks WHERE id = ?`, [id])
  if (!row) return reply.code(404).send({ error: 'not found' })
  if (row.state !== 'expired') return reply.code(409).send({ error: 'tube is not in the dustbin' })
  const { days } = req.body || {}
  const daysTotal = clampDays(days)
  if (!daysTotal) return reply.code(400).send({ error: `days (1-${MAX_DAYS}) is required to restore` })
  const t = now()
  const maxRow = db.get(`SELECT MAX(position) as m FROM tasks`)
  const maxPos = maxRow && maxRow.m != null ? maxRow.m : 0
  db.run(
    `UPDATE tasks
     SET state = 'queued', created_at = ?, updated_at = ?, position = ?, days_total = ?, expires_at = ?,
         next_step = NULL, paused_at = NULL, expired_at = NULL
     WHERE id = ?`,
    [t, t, maxPos + 1, daysTotal, t + daysTotal * db.MS_PER_DAY, id]
  )
  const updated = db.get(`SELECT * FROM tasks WHERE id = ?`, [id])
  reply.send(serialize(updated))
})

app.patch('/api/tasks/:id/days', async (req, reply) => {
  // Sets the tube's upper-bound estimate to an absolute value (not additive
  // — "I said 7, I want it to say 9" means set it to 9, not 7+9=16). The
  // new countdown is recomputed from the tube's original created_at, so
  // "9 days" always means 9 days from when it was first started, however
  // much of that has already elapsed.
  const id = Number(req.params.id)
  const row = db.get(`SELECT * FROM tasks WHERE id = ?`, [id])
  if (!row) return reply.code(404).send({ error: 'not found' })
  if (!['queued', 'active', 'paused'].includes(row.state)) {
    return reply.code(409).send({ error: 'only an active, queued, or paused tube can be edited' })
  }
  if (row.days_total == null) {
    return reply.code(409).send({ error: 'tube has no estimate to edit' })
  }
  const { days } = req.body || {}
  const newDaysTotal = clampDays(days)
  if (!newDaysTotal) return reply.code(400).send({ error: `days (1-${MAX_DAYS}) is required` })
  const t = now()
  const newExpiresAt = row.created_at + newDaysTotal * db.MS_PER_DAY
  db.run(`UPDATE tasks SET days_total = ?, expires_at = ?, updated_at = ? WHERE id = ?`, [
    newDaysTotal,
    newExpiresAt,
    t,
    id,
  ])
  const updated = db.get(`SELECT * FROM tasks WHERE id = ?`, [id])
  reply.send(serialize(updated))
})

app.post('/api/tasks/:id/start', async (req, reply) => {
  const id = Number(req.params.id)
  const active = db.get(`SELECT * FROM tasks WHERE state = 'active'`)
  if (active && active.id !== id) {
    return reply.code(409).send({ error: 'another task is active', activeId: active.id })
  }
  const row = db.get(`SELECT * FROM tasks WHERE id = ?`, [id])
  if (!row) return reply.code(404).send({ error: 'not found' })
  const t = now()
  db.run(`UPDATE tasks SET state = 'active', updated_at = ? WHERE id = ?`, [t, id])
  const updated = db.get(`SELECT * FROM tasks WHERE id = ?`, [id])
  reply.send(serialize(updated))
})

app.post('/api/tasks/:id/back', async (req, reply) => {
  const id = Number(req.params.id)
  const row = db.get(`SELECT * FROM tasks WHERE id = ?`, [id])
  if (!row) return reply.code(404).send({ error: 'not found' })
  if (row.state !== 'active') return reply.code(409).send({ error: 'task is not active' })
  const t = now()
  const newState = row.next_step ? 'paused' : 'queued'
  db.run(`UPDATE tasks SET state = ?, updated_at = ? WHERE id = ?`, [newState, t, id])
  const updated = db.get(`SELECT * FROM tasks WHERE id = ?`, [id])
  reply.send(serialize(updated))
})

app.post('/api/tasks/:id/pause', async (req, reply) => {
  const id = Number(req.params.id)
  const { next_step } = req.body || {}
  if (!next_step || typeof next_step !== 'string' || !next_step.trim()) {
    return reply.code(400).send({ error: 'next_step is required' })
  }
  const row = db.get(`SELECT * FROM tasks WHERE id = ?`, [id])
  if (!row) return reply.code(404).send({ error: 'not found' })
  const t = now()
  db.run(`UPDATE tasks SET state = 'paused', next_step = ?, updated_at = ?, paused_at = ? WHERE id = ?`, [
    next_step.trim(),
    t,
    t,
    id,
  ])
  const updated = db.get(`SELECT * FROM tasks WHERE id = ?`, [id])
  reply.send(serialize(updated))
})

app.post('/api/tasks/:id/resume', async (req, reply) => {
  const id = Number(req.params.id)
  const active = db.get(`SELECT * FROM tasks WHERE state = 'active'`)
  if (active && active.id !== id) {
    return reply.code(409).send({ error: 'another task is active', activeId: active.id })
  }
  const row = db.get(`SELECT * FROM tasks WHERE id = ?`, [id])
  if (!row) return reply.code(404).send({ error: 'not found' })
  const t = now()
  db.run(`UPDATE tasks SET state = 'active', updated_at = ? WHERE id = ?`, [t, id])
  const updated = db.get(`SELECT * FROM tasks WHERE id = ?`, [id])
  reply.send(serialize(updated))
})

app.post('/api/tasks/:id/done', async (req, reply) => {
  const id = Number(req.params.id)
  const row = db.get(`SELECT * FROM tasks WHERE id = ?`, [id])
  if (!row) return reply.code(404).send({ error: 'not found' })
  const t = now()
  db.run(`UPDATE tasks SET state = 'done', updated_at = ?, done_at = ? WHERE id = ?`, [t, t, id])
  reply.send({ ok: true })
})

app.post('/api/tasks/:id/drop', async (req, reply) => {
  const id = Number(req.params.id)
  const row = db.get(`SELECT * FROM tasks WHERE id = ?`, [id])
  if (!row) return reply.code(404).send({ error: 'not found' })
  const t = now()
  db.run(`UPDATE tasks SET state = 'dropped', updated_at = ? WHERE id = ?`, [t, id])
  reply.send({ ok: true })
})

app.patch('/api/tasks/:id/position', async (req, reply) => {
  const id = Number(req.params.id)
  const { position } = req.body || {}
  if (typeof position !== 'number') {
    return reply.code(400).send({ error: 'position must be a number' })
  }
  const row = db.get(`SELECT * FROM tasks WHERE id = ?`, [id])
  if (!row) return reply.code(404).send({ error: 'not found' })
  db.run(`UPDATE tasks SET position = ?, updated_at = ? WHERE id = ?`, [position, now(), id])
  reply.send({ ok: true })
})

app.setNotFoundHandler((req, reply) => {
  if (req.raw.url && req.raw.url.startsWith('/api')) {
    reply.code(404).send({ error: 'not found' })
    return
  }
  reply.sendFile('index.html')
})

db.init().then(() =>
  app.listen({ port: PORT, host: '0.0.0.0' }).then(() => {
    console.log(`smart-queue listening on ${PORT}`)
  })
)
