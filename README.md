# The Queue

A personal queue for work, study, and task items you start and abandon midway. Its one job: make returning to a task effortless, by forcing a "next step" note the moment you leave it.

Only one task can ever be active at a time. Pausing without a note isn't allowed — your future self always gets a breadcrumb.

## Features

- **Add** a ticket with a title and tag (`work` / `study` / `task`), optionally flagged **urgent** 🔥
- **Start** a ticket — only one active at a time; starting another forces you to pause the current one first
- **Pause** requires a one-line next-step note before it completes
- **Resume** shows that note first, then goes active
- **Done** / **Drop** to clear a ticket
- **Back** — undo an accidental start with no note required
- **Urgent** tickets always sort first and get a pulsing red badge so nothing "do it now" gets buried
- 5 switchable color themes (persisted locally), keyboard shortcuts (`n`, `←/→`, `Enter`, `p`, `d`, `x`, `b`, `Esc`)

## Stack

- **Frontend:** Vite + React + TypeScript, `motion` for spring animations, `@use-gesture/react` for drag
- **Backend:** Fastify + `sql.js` (SQLite compiled to WASM — no native build step), single Node process serves the API and the built frontend
- **Persistence:** SQLite file on a mounted Docker volume

## Run it

```bash
docker compose up -d --build
```

Runs on **http://localhost:4747**. Data persists in `./data/queue.db` — a real, standard SQLite 3 file (openable with `sqlite3 data/queue.db` or any SQLite tool), written via `sql.js` (SQLite compiled to WebAssembly) and saved atomically on every change. It survives container restarts and rebuilds; it's only gone if you delete `./data` yourself. Check `docker logs <container>` on boot — it prints how many tasks it loaded from disk.

For local development without Docker:

```bash
npm install && npm run build   # builds the frontend into dist/
cd server && npm install
DB_PATH=./data/queue.db node index.js
```

See `DECISIONS.md` for the reasoning behind every non-obvious design and implementation choice made along the way.
